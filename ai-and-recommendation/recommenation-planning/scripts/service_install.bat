@echo off
REM ============================================================
REM Career Path Planner API - Windows Service Installer
REM Uses NSSM (Non-Sucking Service Manager)
REM ============================================================

setlocal enabledelayedexpansion

set SERVICE_NAME=CareerPlannerAPI
set SERVICE_DISPLAY=Career Path Planner API
set SERVICE_DESC=DQN-based career planning REST API service
set PORT=8000

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

REM Python executable from venv
set PYTHON_EXE=%PROJECT_DIR%\.venv\Scripts\python.exe
set UVICORN_MODULE=uvicorn

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if Python venv exists
if not exist "%PYTHON_EXE%" (
    echo ERROR: Python virtual environment not found at:
    echo %PYTHON_EXE%
    echo Please create the venv first: python -m venv .venv
    pause
    exit /b 1
)

REM Check if NSSM exists in current directory or PATH
set NSSM_EXE=nssm.exe
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%SCRIPT_DIR%nssm.exe" (
        set NSSM_EXE=%SCRIPT_DIR%nssm.exe
    ) else (
        echo NSSM not found. Downloading...
        echo.
        echo Please download NSSM from: https://nssm.cc/download
        echo Extract nssm.exe to: %SCRIPT_DIR%
        echo Then run this script again.
        echo.
        echo Alternatively, install via: winget install nssm
        pause
        exit /b 1
    )
)

echo ============================================================
echo Installing %SERVICE_DISPLAY%
echo ============================================================
echo.
echo Service Name: %SERVICE_NAME%
echo Python: %PYTHON_EXE%
echo Working Dir: %SCRIPT_DIR%
echo Port: %PORT%
echo.

REM Stop existing service if running
echo Stopping existing service (if any)...
%NSSM_EXE% stop %SERVICE_NAME% >nul 2>&1

REM Remove existing service
echo Removing existing service (if any)...
%NSSM_EXE% remove %SERVICE_NAME% confirm >nul 2>&1

REM Install the service
echo Installing service...
%NSSM_EXE% install %SERVICE_NAME% "%PYTHON_EXE%" -m %UVICORN_MODULE% api:app --host 0.0.0.0 --port %PORT%

if %errorlevel% neq 0 (
    echo ERROR: Failed to install service
    pause
    exit /b 1
)

REM Configure service
echo Configuring service...

REM Set working directory
%NSSM_EXE% set %SERVICE_NAME% AppDirectory "%SCRIPT_DIR%"

REM Set display name and description
%NSSM_EXE% set %SERVICE_NAME% DisplayName "%SERVICE_DISPLAY%"
%NSSM_EXE% set %SERVICE_NAME% Description "%SERVICE_DESC%"

REM Set startup type to automatic
%NSSM_EXE% set %SERVICE_NAME% Start SERVICE_AUTO_START

REM Configure restart on failure
%NSSM_EXE% set %SERVICE_NAME% AppThrottle 1500
%NSSM_EXE% set %SERVICE_NAME% AppExit Default Restart
%NSSM_EXE% set %SERVICE_NAME% AppRestartDelay 5000

REM Configure stdout/stderr logging
set LOG_DIR=%SCRIPT_DIR%logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
%NSSM_EXE% set %SERVICE_NAME% AppStdout "%LOG_DIR%\service.log"
%NSSM_EXE% set %SERVICE_NAME% AppStderr "%LOG_DIR%\service_error.log"
%NSSM_EXE% set %SERVICE_NAME% AppStdoutCreationDisposition 4
%NSSM_EXE% set %SERVICE_NAME% AppStderrCreationDisposition 4
%NSSM_EXE% set %SERVICE_NAME% AppRotateFiles 1
%NSSM_EXE% set %SERVICE_NAME% AppRotateBytes 1048576

echo.
echo ============================================================
echo Service installed successfully!
echo ============================================================
echo.
echo Starting service...
%NSSM_EXE% start %SERVICE_NAME%

timeout /t 3 >nul

REM Check if service is running
sc query %SERVICE_NAME% | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo.
    echo Service is RUNNING
    echo.
    echo API available at: http://localhost:%PORT%
    echo Swagger docs at:  http://localhost:%PORT%/docs
    echo Health check at:  http://localhost:%PORT%/health
    echo.
    echo Logs location: %LOG_DIR%
) else (
    echo.
    echo WARNING: Service may not have started correctly.
    echo Check logs at: %LOG_DIR%
    echo.
    echo To check status: sc query %SERVICE_NAME%
    echo To start manually: nssm start %SERVICE_NAME%
)

echo.
pause
