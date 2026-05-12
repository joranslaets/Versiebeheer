# Run this script from the web folder to start a local browser server.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 5500
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server 5500
} else {
    Write-Host 'Python is not available on this machine.' -ForegroundColor Red
    Write-Host 'Install Python or use a browser extension such as Live Server.'
}
