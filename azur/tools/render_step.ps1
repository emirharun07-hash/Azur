# One round of the PC's watch mode. render_on_windows.ps1 watch fetches the branch every 2 minutes, copies ONLY
# azur/render_request.json from origin into azur\.cache\render_request_remote.json and runs this file with
# -RequestFile pointing at that copy. This file is the LOCAL copy: code pushed to the branch is not run until the
# owner confirms it at the PC (render_on_windows.ps1 asks; see azur/tools/RENDER-SICHERHEIT.md).
#
# azur/render_request.json (written by the cloud session):
#   { "id": "r3-a", "note": "...", "set": "scene3", "rebuild": true, "jobs": ["preview", "queue", "moves"] }
#   jobs: preview (quick look, azur/previews), queue (plates, passes, masks, times of day), moves (camera flights),
#         export (jersey models for the product view), glow (the sign's halo, after queue), outside (the boy running
#         past the window, after queue: it needs the window maps); "queue:room,bed" passes arguments.
#   rebuild: build the scene again and drop that set's earlier outputs (they belong to the old scene).
#   redo: outputs to delete first so they render again, as patterns in the set's folder ("views/*/masks*.png").
#   pause_until_unix: start no earlier than this (UTC seconds); a request with it is how the cloud pauses the PC.
# Every value is checked before anything happens (Test-Request): set only scene1..scene4, id only [a-z0-9_-]{1,40},
# job names and job arguments only [a-z0-9_]+, redo only simple patterns without "..". A request that fails is
# refused as a whole: nothing is deleted, nothing is started. Every path that is deleted or written is resolved and
# must lie under <repo>\azur\prototype\assets\ or <repo>\azur\.cache\ (Assert-Inside); the one exception is the fixed
# status file azur\render_status.json.
# A request runs once (its id is remembered in azur/.cache/render_request_done.txt). A newer request on the branch
# stops the run between two jobs. One cut short (the PC switched off) resumes at the next start: no rebuild, no redo,
# only the jobs that had not finished. What the PC is doing goes to azur/render_status.json (pushed), without
# absolute paths, user name or computer name (Hide-Private).
# -Offline (for the safety test, RENDER-SICHERHEIT.md): no commit, no push; the status is only written locally.
param([switch]$Hello, [string]$RequestFile = "", [switch]$Offline)
$ErrorActionPreference = "Continue"
$env:AZUR_NO_HANDOVER = "1"
$env:AZUR_QUEUE_NO_GIT = "1"    # the render scripts must not pull (a pull would bring unconfirmed code); this file commits
$Branch = "claude/shopify-notification-signup-o5avym"
$Trailer = "`n`nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`nClaude-Session: https://claude.ai/code/session_01R3wWJYBEPWenzksQTM89FE"
$Repo = [System.IO.Path]::GetFullPath((git rev-parse --show-toplevel))
Set-Location -LiteralPath $Repo
$Cache = "azur\.cache"
$DoneFile = "$Cache\render_request_done.txt"
$StartedFile = "$Cache\render_request_started.txt"    # the request begun last (a PC switched off mid-run resumes it)
$JobsDone = "$Cache\render_request_jobs_done.txt"     # "<id> <job>" for every job that finished
$JobLog = "$Cache\job.log"
$StatusFile = "azur\render_status.json"
$Version = 4
$Dots = [string][char]0x2026
$KnownSets = @("scene1", "scene2", "scene3", "scene4")
$JobFiles = @{ preview = "render_preview.py"; queue = "render_queue.py"; moves = "render_moves.py"; export = "export_models.py"
               glow = "glow.py"; outside = "outside.py" }

# ---------------------------------------------------------------- safety helpers
function Assert-Inside($Path, [string[]]$Roots) {
  # resolve the path and refuse it unless it lies strictly inside one of the roots (relative to the repo)
  $p = if ([System.IO.Path]::IsPathRooted("$Path")) { "$Path" } else { Join-Path $Repo "$Path" }
  $full = [System.IO.Path]::GetFullPath($p)
  foreach ($r in $Roots) {
    $root = [System.IO.Path]::GetFullPath((Join-Path $Repo $r)).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and $full.Length -gt $root.Length) { return $full }
  }
  throw "Pfad ausserhalb von azur\prototype\assets bzw. azur\.cache verweigert: $(Hide-Private $Path)"
}
function Safe-Cache($Path) { return Assert-Inside $Path @("azur\.cache") }
function Safe-Delete($Path) { return Assert-Inside $Path @("azur\prototype\assets", "azur\.cache") }

function Hide-Private($Text) {
  # no absolute paths, user name or computer name in anything that goes to GitHub: keep a path from azur\ on
  $s = "$Text"
  $s = [regex]::Replace($s, '(?i)(?<![a-z])[a-z]:[\\/][^\r\n"'']*?[\\/](?=azur[\\/])', $Dots + '\')
  $s = [regex]::Replace($s, '(?i)\\\\[^\s"'']*?[\\/](?=azur[\\/])', $Dots + '\')
  $s = [regex]::Replace($s, '(?i)(?<![a-z])[a-z]:[\\/][^\s"'']*', $Dots)
  $s = [regex]::Replace($s, '\\\\[^\s"'']+', $Dots)
  $s = [regex]::Replace($s, '(?<![\w.])/(home|Users|root|mnt|tmp)/[^\s"'']*', $Dots)
  foreach ($n in @($env:USERNAME, $env:COMPUTERNAME, $env:USERDOMAIN)) {
    if ($n -and $n.Length -ge 2) { $s = [regex]::Replace($s, [regex]::Escape($n), $Dots, 'IgnoreCase') }
  }
  return $s
}

function Test-CodeSame {
  # true when the local azur/tools and azur/scene equal those on origin (then a rebase brings no new code)
  git diff --quiet HEAD "origin/$Branch" -- azur/tools azur/scene 2>$null
  return ($LASTEXITCODE -eq 0)
}

function Write-Status($State, $ReqId, $Job, $Note) {
  $tail = @()
  if (Test-Path -LiteralPath $JobLog) {
    # plain strings: lines from Get-Content carry PSPath/PSDrive notes, which ConvertTo-Json would write out in full
    $tail = @(Get-Content -LiteralPath $JobLog -Tail 400 | Where-Object { $_ -notmatch "Blender create|glTF import|Data are loaded|DeprecationWarning|use_nodes|^\s*$|Fra:|Sample \d" } | Select-Object -Last 30 | ForEach-Object { Hide-Private "$_" })
  }
  $dev = ""
  if (Test-Path -LiteralPath "$Cache\queue.log") {
    $m = Select-String -LiteralPath "$Cache\queue.log" -Pattern "render device" | Select-Object -Last 1
    if ($m) { $dev = Hide-Private $m.Line }
  }
  $s = [ordered]@{ state = $State; request = (Hide-Private $ReqId); job = (Hide-Private $Job); note = (Hide-Private $Note); watch = $Version
                   time = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); device = $dev; log = $tail }
  # fixed path, checked like every other write
  $path = [System.IO.Path]::GetFullPath((Join-Path $Repo $StatusFile))
  if ($path -ne [System.IO.Path]::GetFullPath((Join-Path $Repo "azur\render_status.json"))) { throw "Status-Pfad verweigert" }
  [System.IO.File]::WriteAllText($path, ($s | ConvertTo-Json -Depth 4))
}

function Push-All($Msg) {
  if ($Offline) { return $false }
  foreach ($p in @("azur/prototype/assets", "azur/previews", "azur/render_status.json")) {
    if (Test-Path $p) { git add -A -- $p 2>$null }
  }
  git commit -q -m ($Msg + $Trailer) 2>$null | Out-Null
  for ($i = 0; $i -lt 4; $i++) {
    git fetch -q origin $Branch 2>$null
    if ($LASTEXITCODE -eq 0) {
      if (-not (Test-CodeSame)) {
        # new code on GitHub that the owner has not confirmed: do not take it in, keep the results here
        Write-Host "Hochladen wartet: auf GitHub liegt geaenderter Code (azur/tools oder azur/scene), der erst am PC bestaetigt werden muss."
        return $false
      }
      git rebase -q --autostash "origin/$Branch" 2>$null | Out-Null
      if ($LASTEXITCODE -ne 0) { git rebase --abort 2>$null | Out-Null }
      else {
        git push -q origin "HEAD:$Branch" 2>$null
        if ($LASTEXITCODE -eq 0) { return $true }
      }
    }
    Start-Sleep -Seconds ([int](2 * [math]::Pow(2, $i)))
  }
  Write-Host "Hochladen hat nicht geklappt (Internet oder GitHub-Login?). Es wird beim naechsten Mal erneut versucht."
  return $false
}

function Get-RemoteRequestId {
  # the id of the request on origin right now ("" if it cannot be read); data only, nothing is run from it
  git fetch -q origin $Branch 2>$null
  if ($LASTEXITCODE -ne 0) { return "" }
  $txt = git show "origin/${Branch}:azur/render_request.json" 2>$null
  if ($LASTEXITCODE -ne 0) { return "" }
  try { return "" + (($txt -join "`n") | ConvertFrom-Json).id } catch { return "" }
}

# ---------------------------------------------------------------- input check (before anything happens)
$IdRx = '\A[a-z0-9_-]{1,40}\z'        # \z, not $: $ also matches before a trailing newline
$WordRx = '\A[a-z0-9_]+\z'
$RedoRx = '\A[a-z0-9_*][a-z0-9_*/.-]{0,79}\z'

function Test-Request($Req) {
  # returns "" if the request is fine, otherwise the reason (without echoing the bad value)
  if (-not ($Req.id -is [string]) -or $Req.id -cnotmatch $IdRx) { return "Feld id ist ungueltig (erlaubt: a-z 0-9 _ -, hoechstens 40 Zeichen)" }
  if ($null -ne $Req.set) {
    if (-not ($Req.set -is [string]) -or -not ($KnownSets -ccontains $Req.set)) { return "Feld set ist ungueltig (erlaubt: scene1, scene2, scene3, scene4)" }
  }
  if ($null -ne $Req.note -and -not ($Req.note -is [string])) { return "Feld note ist kein Text" }
  if ($null -ne $Req.rebuild -and -not ($Req.rebuild -is [bool])) { return "Feld rebuild ist nicht true/false" }
  if ($null -ne $Req.pause_until_unix -and ("" + $Req.pause_until_unix) -cnotmatch '\A[0-9]{1,12}\z') { return "Feld pause_until_unix ist keine Zahl" }
  foreach ($job in @($Req.jobs)) {
    if ($null -eq $job) { continue }
    if (-not ($job -is [string])) { return "Ein Eintrag in jobs ist kein Text" }
    $parts = $job -split ":", 2
    if ($parts[0] -cnotmatch $WordRx -or -not $JobFiles.ContainsKey($parts[0])) { return "Unbekannter oder ungueltiger Auftrag in jobs" }
    if ($parts.Count -gt 1) {
      foreach ($a in ($parts[1] -split ",")) { if ($a -cnotmatch $WordRx) { return "Ungueltiges Argument in jobs (erlaubt: a-z 0-9 _)" } }
    }
  }
  foreach ($pat in @($Req.redo)) {
    if ($null -eq $pat) { continue }
    if (-not ($pat -is [string]) -or $pat -cnotmatch $RedoRx -or $pat.Contains("..") -or $pat.Contains("//")) { return "Ungueltiges Muster in redo" }
  }
  return ""
}

function Run-Job($Job) {
  # $Job was checked by Test-Request: a known name and arguments of [a-z0-9_] only
  $parts = $Job -split ":", 2
  $file = $JobFiles[$parts[0]]
  if (-not $file) { Write-Host "Unbekannter Auftrag"; return 2 }
  $argv = @("azur\scene\$file")
  if ($parts.Count -gt 1 -and $parts[1]) { $argv += ($parts[1] -split ",") }
  $env:PYTHONUNBUFFERED = "1"
  $log = Safe-Cache $JobLog
  # show the output live and keep it for the status file
  & python @argv 2>&1 | ForEach-Object { "$_" } | Tee-Object -FilePath $log | Out-Host
  return $LASTEXITCODE
}

New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetFullPath((Join-Path $Repo $Cache))) | Out-Null

if ($Hello) {
  if (Test-Path -LiteralPath $JobLog) { Remove-Item -LiteralPath (Safe-Cache $JobLog) }
  Write-Status "bereit" "" "" "Warte-Modus laeuft (Version $Version)"
  Push-All "AZUR PC: watch mode ready" | Out-Null
  return
}

# what was rendered while the internet was down (the owner's line is off at night) goes up as soon as it is back:
# a request that finished offline left its last commits on this PC
$ahead = git rev-list --count "origin/$Branch..HEAD" 2>$null
if ($LASTEXITCODE -eq 0 -and $ahead -and [int]$ahead -gt 0) {
  Write-Host ("[{0}] {1} Commits warten aufs Hochladen" -f (Get-Date -Format "HH:mm"), $ahead)
  Push-All "AZUR PC: upload what was rendered offline" | Out-Null
}

# the request: the copy fetched from origin by render_on_windows.ps1 (data only), else the local file
$reqPath = if ($RequestFile) { Safe-Cache $RequestFile } else { [System.IO.Path]::GetFullPath((Join-Path $Repo "azur\render_request.json")) }
if (-not (Test-Path -LiteralPath $reqPath)) { return }
$req = $null
try {
  $raw = [System.IO.File]::ReadAllText($reqPath)
  if ($raw.Length -gt 20000) { throw "zu gross" }
  $req = $raw | ConvertFrom-Json
} catch { $req = $null }
$problem = if ($req) { Test-Request $req } else { "Auftragsdatei ist kein gueltiges JSON" }
if ($problem) {
  Write-Host ("[{0}] Auftrag abgelehnt: {1}. Es wird nichts geloescht und nichts gestartet." -f (Get-Date -Format "HH:mm"), $problem)
  $cur = $null
  try { $cur = Get-Content $StatusFile -Raw | ConvertFrom-Json } catch { }
  if (-not $cur -or $cur.state -ne "abgelehnt" -or $cur.note -ne $problem) {
    Write-Status "abgelehnt" "" "" $problem
    Push-All "AZUR PC: request refused" | Out-Null
  }
  return
}
$last = if (Test-Path -LiteralPath $DoneFile) { (Get-Content -LiteralPath $DoneFile -Raw).Trim() } else { "" }
if ($req.id -eq $last) { return }
$note = if ($req.note) { $req.note.Substring(0, [math]::Min(300, $req.note.Length)) } else { "" }

# a pause: "pause_until_unix" (seconds since 1970, UTC) holds the request back until then. A running request stops
# for it like for any newer one (between two jobs); this one starts by itself when the time has passed.
if ($req.pause_until_unix -and [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() -lt [int64]$req.pause_until_unix) {
  $until = [DateTimeOffset]::FromUnixTimeSeconds([int64]$req.pause_until_unix).LocalDateTime.ToString("dd.MM. HH:mm")
  $cur = $null
  try { $cur = Get-Content $StatusFile -Raw | ConvertFrom-Json } catch { }
  if (-not $cur -or $cur.state -ne "pausiert" -or $cur.request -ne $req.id) {
    Write-Host ("[{0}] Pause bis {1}, danach geht es mit {2} weiter" -f (Get-Date -Format "HH:mm"), $until, $req.id)
    Write-Status "pausiert" $req.id "" ("Pause bis $until, danach: " + $note)
    Push-All "AZUR PC: Pause bis $until (dann $($req.id))" | Out-Null
  }
  return
}

# begun before and cut short (the PC was switched off): resume it, without rebuilding or deleting what is done,
# and without the jobs that already finished. Begun: noted in $StartedFile, or this PC's own commits for it are in
# the history ("AZUR PC: <id> <job> started"). Finished jobs: noted in $JobsDone, or their commit
# "AZUR renders from the PC: <id> <job>".
$started = if (Test-Path -LiteralPath $StartedFile) { (Get-Content -LiteralPath $StartedFile -Raw).Trim() } else { "" }
$subjects = @(git log --format=%s -3000 2>$null | ForEach-Object { "$_" })
$resume = ($started -eq $req.id) -or (@($subjects | Where-Object { $_.StartsWith("AZUR PC: " + $req.id + " ") }).Count -gt 0)
$doneJobs = @()
if ($resume) {
  $prefix = "AZUR renders from the PC: " + $req.id + " "
  $doneJobs = @($subjects | Where-Object { $_.StartsWith($prefix) } | ForEach-Object { $_.Substring($prefix.Length) })
  if (Test-Path -LiteralPath $JobsDone) {
    $doneJobs += @(Get-Content -LiteralPath $JobsDone | Where-Object { $_.StartsWith($req.id + " ") } | ForEach-Object { $_.Substring($req.id.Length + 1) })
  }
}
Set-Content -LiteralPath (Safe-Cache $StartedFile) -Value $req.id
if ($resume) { Write-Host ("[{0}] Auftrag {1} wird fortgesetzt" -f (Get-Date -Format "HH:mm"), $req.id) }
else { Write-Host ("[{0}] Neuer Auftrag {1}: {2}" -f (Get-Date -Format "HH:mm"), $req.id, $note) }
$env:AZUR_REQUEST_ID = $req.id
if ($req.set) { $env:AZUR_SET = $req.set } else { $env:AZUR_SET = "scene3" }
$set = $env:AZUR_SET
try {
  if ($req.rebuild -and -not $resume) {
    $blend = Safe-Delete ("$Cache\azur_room_" + $set + ".blend")
    Remove-Item -LiteralPath $blend -ErrorAction SilentlyContinue
    if ($set -notin @("scene1", "scene2")) {
      # outputs of the old scene would be skipped as "done": remove them (they come back from the new scene)
      foreach ($d in @(("azur\prototype\assets\" + $set), ("$Cache\exr\" + $set), ("$Cache\moves\" + $set))) {
        $full = Safe-Delete $d
        if (Test-Path -LiteralPath $full) { Remove-Item -LiteralPath $full -Recurse -Force -ErrorAction SilentlyContinue }
      }
    }
  }
  if ($req.redo -and -not $resume) {
    # outputs to render again (patterns inside this set's folder, e.g. "views/*/masks*.png")
    $setDir = "azur\prototype\assets\" + $set
    $setFull = Safe-Delete $setDir
    foreach ($pat in @($req.redo)) {
      Get-ChildItem -Path (Join-Path $setFull ($pat -replace '/', '\')) -File -ErrorAction SilentlyContinue | ForEach-Object {
        $f = Assert-Inside $_.FullName @($setDir)
        Remove-Item -LiteralPath $f -Force
      }
    }
  }
} catch {
  Write-Host ("Abbruch: " + (Hide-Private $_))
  Write-Status "abgelehnt" $req.id "" (Hide-Private $_)
  Push-All "AZUR PC: $($req.id) refused" | Out-Null
  return
}
# fixed versions (azur/tools/requirements-render.txt), only into the active azur\.venv
uv pip install -q -r azur\tools\requirements-render.txt

$final = "fertig"; $failed = @()
foreach ($job in @($req.jobs)) {
  if ($null -eq $job -or $doneJobs -contains $job) { continue }
  $rid = Get-RemoteRequestId
  if ($rid -and $rid -ne $req.id) { $final = "abgeloest"; $note = "neuer Auftrag auf dem Branch, dieser wurde vor $job beendet"; break }
  Write-Status "arbeitet" $req.id $job $note
  Push-All "AZUR PC: $($req.id) $job started" | Out-Null
  $t0 = Get-Date
  $code = Run-Job $job
  $mins = [math]::Round(((Get-Date) - $t0).TotalMinutes, 1)
  if ($code -eq 3) { $final = "abgeloest"; $note = "neuer Auftrag auf dem Branch, dieser wurde bei $job beendet"; break }
  if ($code -ne 0) {
    # report it (the commit keeps this job's log), then go on: the next jobs do not depend on it
    $failed += "$job (Exit $code nach $mins min)"
    Write-Status "fehler" $req.id $job ("$job ist fehlgeschlagen (Exit $code nach $mins min), es geht mit dem naechsten Auftragsteil weiter")
    Push-All "AZUR PC: $($req.id) $job failed" | Out-Null
    continue
  }
  Add-Content -LiteralPath (Safe-Cache $JobsDone) -Value ($req.id + " " + $job)
  Write-Status "arbeitet" $req.id $job "$job fertig nach $mins min"
  Push-All "AZUR renders from the PC: $($req.id) $job" | Out-Null
}
Set-Content -LiteralPath (Safe-Cache $DoneFile) -Value $req.id
if ($failed.Count -and $final -eq "fertig") { $final = "fehler"; $note = "fehlgeschlagen: " + ($failed -join ", ") }
Write-Status $final $req.id "" $note
Push-All "AZUR PC: $($req.id) $final" | Out-Null
Write-Host ("[{0}] Auftrag {1}: {2}" -f (Get-Date -Format "HH:mm"), $req.id, $final)
