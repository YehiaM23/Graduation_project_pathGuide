@echo off
REM ============================================================
REM Career Path Planner API - Windows Service Uninstaller
REM ============================================================

set SERVICE_NAME=CareerPlannerAPI

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if NSSM exists
set NSSM_EXE=nssm.exe
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    set SCRIPT_DIR=%~dp0
    if exist "%SCRIPT_DIR%nssm.exe" (
        set NSSM_EXE=%SCRIPT_DIR%nssm.exe
    ) else (
        echo ERROR: NSSM not found.
        pause
        exit /b 1
    )
)

echo ============================================================
echo Uninstalling %SERVICE_NAME%
echo ============================================================
echo.

REM Stop the service
echo Stopping service...
%NSSM_EXE% stop %SERVICE_NAME%
timeout /t 2 >nul

REM Remove the service
echo Removing service...
%NSSM_EXE% remove %SERVICE_NAME% confirm

if %errorlevel% equ 0 (
    echo.
    echo Service removed successfully!
) else (
    echo.
    echo Service may not have been installed.
)

echo.
pause
