# Render the AZUR scene on a Windows PC with a graphics card: Cycles via HIP (AMD Radeon RX 6000 and newer),
# OptiX/CUDA (NVIDIA). Falls back to the CPU if no supported card is found (the queue log says which device it used).
#
# In PowerShell, inside the cloned repo:
#   powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1          everything still missing
#   powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 moves    only the camera moves
#   powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 queue    only view plates and passes
#   powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 test     set up + one timed test render
#   powershell -ExecutionPolicy Bypass -File azur\tools\render_on_windows.ps1 watch    wait for render jobs (see below)
#
# Safety (azur/tools/RENDER-SICHERHEIT.md): this script never pulls code by itself. It fetches the branch, but only
# azur/render_request.json is taken from it (git show, into azur\.cache\render_request_remote.json). Only code that is
# already on this PC runs. When azur/tools or azur/scene on GitHub differ from this PC, the changed files are listed and
# the script asks "Diese Aenderungen uebernehmen? (ja/nein)"; only "ja" takes them in (git merge --ff-only).
#
# watch: leave the window open. Every 2 minutes it fetches the branch and runs the LOCAL azur\tools\render_step.ps1
# with the fetched request: when it has a new "id", it renders what the request names and uploads the results, and it
# reports to azur/render_status.json. While it runs, Windows does not go to sleep (only for this window).
#
# Needs (installed by you, this script installs nothing by itself):
#   Git for Windows   winget install Git.Git      (its credential manager opens a browser for the GitHub login)
#   uv                winget install astral-sh.uv
#   Python 3.11       winget install Python.Python.3.11
# and a current AMD Adrenalin driver. The first run makes azur\.venv with the packages in
# azur\tools\requirements-render.txt (fixed versions, about 1 GB). Finished outputs are skipped; every new output is
# committed and pushed. Do not let the cloud render the same job at the same time.
param([string]$Mode = "all")
$ErrorActionPreference = "Stop"
$env:AZUR_NO_HANDOVER = "1"     # the render scripts hand over to watch mode only when an old copy of this script started them
$env:AZUR_QUEUE_NO_GIT = "1"    # the render scripts must not pull (a pull would bring unconfirmed code); this script commits
$Branch = "claude/shopify-notification-signup-o5avym"

foreach ($tool in @(@("git", "winget install Git.Git"), @("uv", "winget install astral-sh.uv"))) {
  if (-not (Get-Command $tool[0] -ErrorAction SilentlyContinue)) {
    Write-Host ("{0} fehlt. Bitte mit winget installieren: {1}" -f $tool[0], $tool[1])
    Write-Host "Danach ein neues PowerShell-Fenster oeffnen und dieses Skript noch einmal starten."
    exit 1
  }
}
$Repo = [System.IO.Path]::GetFullPath((git rev-parse --show-toplevel))
Set-Location -LiteralPath $Repo
$here = git rev-parse --abbrev-ref HEAD
if ($here -ne $Branch) {
  Write-Host "Dieses Fenster steht nicht auf dem Render-Branch. Bitte einmal selbst ausfuehren und pruefen:"
  Write-Host "  git switch $Branch"
  exit 1
}
if (-not (git config user.email)) {
  Write-Host "git kennt dich noch nicht. Einmal ausfuehren (deine private GitHub-E-Mail):"
  Write-Host '  git config --global user.name "Dein Name"; git config --global user.email "deine@mail.de"'
  exit 1
}
if (-not (Test-Path "azur\.venv")) {
  # no download of Python by uv: it has to be installed already
  uv venv -q --no-python-downloads -p 3.11 azur\.venv
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Python 3.11 fehlt. Bitte mit winget installieren: winget install Python.Python.3.11 (uv: winget install astral-sh.uv)"
    exit 1
  }
}
. "azur\.venv\Scripts\Activate.ps1"

$env:AZUR_GPU = "1"
$ErrorActionPreference = "Continue"
$Cache = [System.IO.Path]::GetFullPath((Join-Path $Repo "azur\.cache"))
New-Item -ItemType Directory -Force -Path $Cache | Out-Null
$RemoteRequest = Join-Path $Cache "render_request_remote.json"
$script:Declined = ""

function Test-CodeSame {
  git diff --quiet HEAD "origin/$Branch" -- azur/tools azur/scene 2>$null
  return ($LASTEXITCODE -eq 0)
}

function Confirm-CodeUpdate {
  # after a fetch: if azur/tools or azur/scene differ from origin, show what and ask at this PC. Only "ja" takes it
  # in. Any other answer (or none) changes nothing; the same state on origin is not asked about again.
  if (Test-CodeSame) { return }
  $theirs = git rev-parse "origin/$Branch" 2>$null
  if ($theirs -eq $script:Declined) { return }
  Write-Host ""
  Write-Host "Auf GitHub ist Code in azur/tools oder azur/scene anders als auf diesem PC:"
  git diff --stat HEAD "origin/$Branch" -- azur/tools azur/scene | Out-Host
  Write-Host "Ansehen: git diff HEAD origin/$Branch -- azur/tools azur/scene"
  $answer = Read-Host "Diese Aenderungen uebernehmen? (ja/nein)"
  if ("$answer".Trim().ToLower() -ne "ja") {
    $script:Declined = $theirs
    Write-Host "Nicht uebernommen. Es laeuft weiter nur der Code auf diesem PC; Ergebnisse bleiben hier, bis du zustimmst."
    return
  }
  git merge -q --ff-only "origin/$Branch"
  if ($LASTEXITCODE -ne 0) {
    # this PC has its own render commits on top: put them after the confirmed state
    git rebase -q --autostash "origin/$Branch"
    if ($LASTEXITCODE -ne 0) { git rebase --abort 2>$null; Write-Host "Uebernehmen hat nicht geklappt (Konflikt). Bitte selbst pruefen."; return }
  }
  Write-Host "Uebernommen."
}

function Get-RemoteRequest {
  # copy only azur/render_request.json from origin into azur\.cache (data, never run); $false if that fails
  $txt = git show "origin/${Branch}:azur/render_request.json" 2>$null
  if ($LASTEXITCODE -ne 0) { return $false }
  [System.IO.File]::WriteAllText($RemoteRequest, ($txt -join "`n"))
  return $true
}

function Push-Results($Msg) {
  git add -A -- azur/prototype/assets 2>$null
  git commit -q -m $Msg 2>$null | Out-Null
  git fetch -q origin $Branch
  if (-not (Test-CodeSame)) { Write-Host "Hochladen wartet: auf GitHub liegt Code, den du noch nicht bestaetigt hast."; return }
  git rebase -q --autostash "origin/$Branch"
  if ($LASTEXITCODE -ne 0) { git rebase --abort 2>$null; return }
  git push -q origin "HEAD:$Branch"
  if ($LASTEXITCODE -eq 0) { Write-Host "Alles hochgeladen." }
}

git fetch -q origin $Branch
Confirm-CodeUpdate
uv pip install -q -r azur\tools\requirements-render.txt

if ($Mode -eq "watch") {
  # keep the PC awake while this window runs (ES_CONTINUOUS | ES_SYSTEM_REQUIRED)
  Add-Type -Namespace Azur -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);'
  [Azur.Power]::SetThreadExecutionState([uint32]"0x80000001") | Out-Null
  Write-Host "Warte-Modus: alle 2 Minuten wird nach neuen Render-Auftraegen geschaut. Fenster offen lassen, Strg+C beendet."
  & "$Repo\azur\tools\render_step.ps1" -Hello
  Write-Host "Bereit gemeldet (azur/render_status.json auf GitHub)."
  while ($true) {
    git fetch -q origin $Branch 2>$null
    if ($LASTEXITCODE -eq 0) {
      Confirm-CodeUpdate
      if (Get-RemoteRequest) {
        # the local render_step.ps1 (read fresh each round: a confirmed update applies without restarting)
        try { & "$Repo\azur\tools\render_step.ps1" -RequestFile $RemoteRequest } catch { Write-Host ("Fehler: " + $_) }
      }
    }
    Start-Sleep -Seconds 120
  }
}
if ($Mode -eq "test") {
  python azur\scene\bench.py
  Select-String -Path "azur\.cache\queue.log" -Pattern "render device|bench:" | Select-Object -Last 2
  exit 0
}
switch ($Mode) {
  "queue" { python azur\scene\render_queue.py }
  "moves" { python azur\scene\render_moves.py }
  default { python azur\scene\render_queue.py; if ($LASTEXITCODE -eq 0) { python azur\scene\render_moves.py } }
}
Select-String -Path "azur\.cache\queue.log" -Pattern "render device" | Select-Object -Last 1

# the outputs (the render scripts do not commit while AZUR_QUEUE_NO_GIT is set)
Push-Results "AZUR renders from the PC"
