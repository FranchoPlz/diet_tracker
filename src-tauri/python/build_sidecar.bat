@echo off
setlocal

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..

:: Activate Python venv (create if needed)
if not exist "%PROJECT_ROOT%\.venv" (
    echo Creating Python virtual environment...
    python -m venv "%PROJECT_ROOT%\.venv"
)
call "%PROJECT_ROOT%\.venv\Scripts\activate.bat"

:: Install Python dependencies
pip install -r "%SCRIPT_DIR%requirements.txt" pyinstaller >nul 2>&1

:: Build sidecar with PyInstaller
pyinstaller "%SCRIPT_DIR%diet_parser.spec" --distpath "%SCRIPT_DIR%dist" --workpath "%SCRIPT_DIR%build" --clean -y

:: Copy to src-tauri with Windows target triple
set TARGET_TRIPLE=x86_64-pc-windows-msvc
copy "%SCRIPT_DIR%dist\diet_parser.exe" "%PROJECT_ROOT%\src-tauri\diet_parser-%TARGET_TRIPLE%.exe"
echo Sidecar binary built: src-tauri\diet_parser-%TARGET_TRIPLE%.exe

endlocal
