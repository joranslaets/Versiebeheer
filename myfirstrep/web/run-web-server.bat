@echo off
cd /d "%~dp0"
python -m http.server 5500 2>nul
if errorlevel 1 (
    py -m http.server 5500
)
