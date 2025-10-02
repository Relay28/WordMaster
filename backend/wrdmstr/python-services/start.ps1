<#!
PowerShell launcher for GECToR Grammar Correction Service
Usage:
  ./start.ps1                # heuristic only
  ./start.ps1 -Model         # load transformer model
  ./start.ps1 -Reinstall     # force reinstall dependencies
  ./start.ps1 -Model -Reinstall
#>
[CmdletBinding()]
param(
  [switch]$Model,
  [switch]$Reinstall
)
$ErrorActionPreference = 'Stop'
Write-Host "[GECToR] PowerShell starter" -ForegroundColor Cyan

# Resolve script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Find-Python {
  $candidates = @('py','python','python3')
  foreach ($c in $candidates) { if (Get-Command $c -ErrorAction SilentlyContinue) { return $c } }
  throw 'Python (py or python) not found in PATH.'
}

$py = Find-Python
Write-Host "Using interpreter: $py"

if (-not (Test-Path .venv)) {
  Write-Host '[GECToR] Creating virtual environment (.venv)...'
  & $py -m venv .venv
}

# Activate venv (scoped for this process)
$activate = Join-Path .venv 'Scripts/Activate.ps1'
if (-not (Test-Path $activate)) { throw 'Activation script missing (venv creation failed?)' }
. $activate

Write-Host '[GECToR] Upgrading pip (quiet)...'
python -m pip install --upgrade pip | Out-Null

if ($Reinstall) {
  Write-Host '[GECToR] Reinstalling dependencies (forced)...'
  pip install --no-cache-dir -r requirements.txt
} else {
  Write-Host '[GECToR] Ensuring dependencies installed...'
  pip install -r requirements.txt | Out-Null
}

if ($Model) {
  $env:GECTOR_LOAD_MODEL = '1'
  Write-Host '[GECToR] Model load ENABLED (large download if first time)'
}

Write-Host '[GECToR] Launching service on port 5001...'
try {
  python gector_service.py
} catch {
  Write-Host "[GECToR][ERROR] Service crashed: $_" -ForegroundColor Red
}
