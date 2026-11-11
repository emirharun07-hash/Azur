# AZUR Termine – Installer für Windows
# Nimmt die offizielle Electron-Laufzeit (vom Kampagnen Board, falls schon geladen, sonst von GitHub),
# baut daraus die App unter %LOCALAPPDATA%\Programs\AZUR Termine, legt Verknüpfungen an und startet sie.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Version = '33.4.11'
$AppName = 'AZUR Termine'
$Here    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Source  = Join-Path (Split-Path -Parent $Here) 'app'
$Dest    = Join-Path $env:LOCALAPPDATA "Programs\$AppName"
$Cache   = Join-Path $env:LOCALAPPDATA 'AZURTermine\cache'
$Arch    = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
$ZipName = "electron-v$Version-win32-$Arch.zip"
$Zip     = Join-Path $Cache $ZipName
$KbZip   = Join-Path $env:LOCALAPPDATA "KampagnenBoard\cache\$ZipName"
$Url     = "https://github.com/electron/electron/releases/download/v$Version/$ZipName"
$RcEdit  = Join-Path $Cache 'rcedit-x64.exe'
$KbRc    = Join-Path $env:LOCALAPPDATA 'KampagnenBoard\cache\rcedit-x64.exe'

function Step($t) { Write-Host ""; Write-Host "  > $t" -ForegroundColor Cyan }

Write-Host ""
Write-Host "  AZUR Termine wird installiert ..." -ForegroundColor White
Write-Host "  ---------------------------------"

if (-not (Test-Path (Join-Path $Source 'package.json'))) {
  throw "Der Ordner 'app' fehlt. Bitte die ZIP-Datei zuerst komplett entpacken (Rechtsklick > Alle extrahieren)."
}

Step 'Laufende App beenden'
Get-Process -Name $AppName -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 600

New-Item -ItemType Directory -Force -Path $Cache | Out-Null
if (-not (Test-Path $Zip) -or (Get-Item $Zip).Length -lt 50MB) {
  if ((Test-Path $KbZip) -and (Get-Item $KbZip).Length -gt 50MB) {
    Step 'Electron vom Kampagnen Board übernehmen'
    Copy-Item -Force $KbZip $Zip
  } else {
    Step "Electron $Version ($Arch) herunterladen, ca. 110 MB, nur beim ersten Mal ..."
    Invoke-WebRequest -Uri $Url -OutFile "$Zip.part" -UseBasicParsing
    Move-Item -Force "$Zip.part" $Zip
  }
}

Step 'App zusammenbauen'
if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tar) { & tar.exe -xf $Zip -C $Dest } else { Expand-Archive -Path $Zip -DestinationPath $Dest -Force }
Rename-Item (Join-Path $Dest 'electron.exe') "$AppName.exe"
Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $Dest 'resources\default_app.asar')
Copy-Item -Recurse $Source (Join-Path $Dest 'resources\app')
$Exe  = Join-Path $Dest "$AppName.exe"
$Icon = Join-Path $Dest 'resources\app\build\icon.ico'

# Eigenes Symbol und Name in der .exe (für Taskleiste und Task-Manager). Nicht schlimm, falls es nicht klappt.
try {
  if (-not (Test-Path $RcEdit)) {
    if (Test-Path $KbRc) { Copy-Item -Force $KbRc $RcEdit }
    else { Invoke-WebRequest -Uri 'https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe' -OutFile $RcEdit -UseBasicParsing }
  }
  & $RcEdit $Exe --set-icon $Icon --set-version-string 'ProductName' $AppName --set-version-string 'FileDescription' $AppName | Out-Null
} catch { Write-Host "    (Symbol der .exe konnte nicht gesetzt werden, die App funktioniert trotzdem.)" }

Step 'Verknüpfungen anlegen'
$Shell = New-Object -ComObject WScript.Shell
$Places = @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'))
foreach ($dir in $Places) {
  $lnk = $Shell.CreateShortcut((Join-Path $dir "$AppName.lnk"))
  $lnk.TargetPath = $Exe
  $lnk.WorkingDirectory = $Dest
  $lnk.IconLocation = "$Icon,0"
  $lnk.Description = 'Termine und Deadlines von AZUR'
  $lnk.Save()
}

Step 'Starten'
Start-Process $Exe

Write-Host ""
Write-Host "  Fertig! AZUR Termine findest du auf dem Desktop und im Startmenü." -ForegroundColor Green
Write-Host "  Deine Einträge liegen in: $env:APPDATA\$AppName (oder in eurer Cloud)"
Write-Host ""
