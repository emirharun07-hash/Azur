// AZUR Termine – App für Windows und Mac (Hauptprozess)
// Fenster (groß und klein), Einstellungen, lokale Speicherung (data.json), Kalender öffnen,
// und die Cloud-Verbindung des Kampagnen Boards auf diesem Computer finden.
const { app, BrowserWindow, ipcMain, shell, Menu, screen, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

if (!app.requestSingleInstanceLock()) app.quit();
app.setAppUserModelId('com.azur.termine');

const isMac = process.platform === 'darwin';
const file = (n) => path.join(app.getPath('userData'), n);
let win = null;
let mini = false;

function readJSON(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }
function writeAtomic(f, text) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + '.tmp', text);
  if (fs.existsSync(f)) fs.copyFileSync(f, f + '.bak');
  fs.renameSync(f + '.tmp', f);
}

// ---------- Fenster ----------
const MINI = { width: 360, height: 540 };
const winState = () => readJSON(file('window.json')) || {};
const saveWinState = (s) => { try { writeAtomic(file('window.json'), JSON.stringify(s)); } catch {} };

function visible(b) {
  return b && screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return b.x < a.x + a.width - 40 && b.x + b.width > a.x + 40 && b.y >= a.y - 10 && b.y < a.y + a.height - 40;
  });
}
function miniBounds(st) {
  if (visible(st.mini)) return st.mini;
  const a = screen.getDisplayMatching(win.getBounds()).workArea;
  return { x: a.x + a.width - MINI.width - 16, y: a.y + 16, width: MINI.width, height: MINI.height };
}
function remember() {
  if (!win || win.isDestroyed() || win.isMinimized()) return;
  const st = winState();
  if (mini) st.mini = win.getBounds();
  else { st.normal = win.getNormalBounds(); st.maximized = win.isMaximized(); }
  st.isMini = mini;
  saveWinState(st);
}
function applyMini(on) {
  const st = winState();
  if (on) {
    if (!mini) { st.normal = win.getNormalBounds(); st.maximized = win.isMaximized(); }
    if (win.isMaximized()) win.unmaximize();
    win.setBounds(miniBounds(st));
    win.setAlwaysOnTop(true, 'floating');
    if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } else {
    if (mini) st.mini = win.getBounds();
    win.setAlwaysOnTop(false);
    if (isMac) win.setVisibleOnAllWorkspaces(false);
    win.setBounds(visible(st.normal) ? st.normal : { ...centered(1100, 780) });
    if (st.maximized) win.maximize();
  }
  mini = on;
  st.isMini = on;
  saveWinState(st);
  return mini;
}
function centered(w, h) {
  const a = screen.getPrimaryDisplay().workArea;
  const width = Math.min(w, a.width), height = Math.min(h, a.height);
  return { x: a.x + Math.round((a.width - width) / 2), y: a.y + Math.round((a.height - height) / 2), width, height };
}
function setMini(on) {
  on = !!on;
  if (!win || on === mini) return mini;
  if (win.isFullScreen()) {
    win.once('leave-full-screen', () => setTimeout(() => { applyMini(on); win.webContents.send('mini', mini); }, 300));
    win.setFullScreen(false);
    return on;
  }
  return applyMini(on);
}

function createWindow() {
  const st = winState();
  const start = visible(st.normal) ? st.normal : centered(1100, 780);
  win = new BrowserWindow({
    ...start,
    minWidth: 280, minHeight: 340,
    title: 'AZUR Termine',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, spellcheck: true },
  });
  if (st.maximized && !st.isMini) win.maximize();
  if (st.isMini) applyMini(true);
  if (!isMac) win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // Links (Google Kalender) im Browser öffnen, nie im App-Fenster.
  win.webContents.on('will-navigate', (e, url) => { if (url !== win.webContents.getURL()) e.preventDefault(); });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F12') win.webContents.toggleDevTools();
    if (input.key === 'F5' || ((input.control || input.meta) && input.key.toLowerCase() === 'r')) { e.preventDefault(); win.webContents.reload(); }
  });
  win.on('close', remember);
}

// Mac braucht ein Menü, sonst gehen Kopieren und Einfügen in Textfeldern nicht.
function buildMacMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { label: 'Bearbeiten', submenu: [
      { role: 'undo', label: 'Widerrufen' }, { role: 'redo', label: 'Wiederholen' }, { type: 'separator' },
      { role: 'cut', label: 'Ausschneiden' }, { role: 'copy', label: 'Kopieren' }, { role: 'paste', label: 'Einfügen' },
      { role: 'selectAll', label: 'Alles auswählen' },
    ] },
    { label: 'Darstellung', submenu: [
      { label: 'Kleines Fenster', accelerator: 'Cmd+Shift+K', click: () => { const v = setMini(!mini); win?.webContents.send('mini', v); } },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Vollbild' },
    ] },
    { role: 'windowMenu', label: 'Fenster' },
  ]));
}

app.on('second-instance', () => { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); });

// ---------- Daten ----------
ipcMain.handle('app:info', () => ({ platform: process.platform, version: app.getVersion() }));
ipcMain.handle('settings:get', () => readJSON(file('settings.json')) || {});
ipcMain.handle('settings:set', (_e, s) => { writeAtomic(file('settings.json'), JSON.stringify(s, null, 2)); return true; });
ipcMain.handle('local:load', () => readJSON(file('data.json')) || readJSON(file('data.json.bak')) || { entries: {} });
ipcMain.handle('local:save', (_e, json) => {
  JSON.parse(json);
  writeAtomic(file('data.json'), json);
  return true;
});
ipcMain.handle('clip:write', (_e, text) => { clipboard.writeText(String(text)); return true; });
ipcMain.handle('win:get-mini', () => mini);
ipcMain.handle('win:set-mini', (_e, on) => setMini(on));

// Cloud des Kampagnen Boards auf diesem Computer (gleiche Tabelle, eigene Zeilen "azur-termine/…").
ipcMain.handle('kb:cloud', () => {
  const kb = readJSON(path.join(app.getPath('appData'), 'Kampagnen Board', 'settings.json'));
  if (kb?.cloud?.url && kb.cloud.key) return { url: kb.cloud.url, key: kb.cloud.key };
  if (kb?.noDefaultCloud) return null;
  const def = isMac
    ? path.join(os.homedir(), 'Applications', 'Kampagnen Board.app', 'Contents', 'Resources', 'app', 'default-cloud.json')
    : path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Kampagnen Board', 'resources', 'app', 'default-cloud.json');
  const d = readJSON(def);
  return d?.url && d.key ? { url: d.url, key: d.key } : null;
});

// Kalenderdatei schreiben und mit dem Standard-Kalender öffnen (Apple Kalender, Outlook, Windows-Kalender).
ipcMain.handle('calendar:open', async (_e, name, text) => {
  try {
    const safe = String(name).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || 'azur-termin';
    const dir = path.join(app.getPath('temp'), 'AZUR Termine');
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, safe + '.ics');
    fs.writeFileSync(f, String(text));
    if (process.env.TERMINE_TEST) return '';
    return await shell.openPath(f);
  } catch (err) {
    return String(err?.message || err);
  }
});

app.whenReady().then(() => { if (isMac) buildMacMenu(); createWindow(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
app.on('window-all-closed', () => { if (!isMac) app.quit(); });
