@echo off
cd /d "%~dp0"
title Resume Blaster Server
echo.
echo  Starting Resume Blaster...
echo  Do NOT close this window while sending emails.
echo.

where py >nul 2>&1
if %errorlevel%==0 (
    py server.py
    goto :done
)

where python >nul 2>&1
if %errorlevel%==0 (
    python server.py
    goto :done
)

echo  ERROR: Python not found.
echo.
echo  Install from https://www.python.org/downloads/
echo  Or open PowerShell here and run:  py server.py
echo.
pause
exit /b 1

:done
if %errorlevel% neq 0 pause
