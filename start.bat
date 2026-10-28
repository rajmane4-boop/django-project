@echo off
setlocal
title Smart MedTrack - Orchestrator
color 0B 2>nul

echo =====================================================================
echo                SMART MEDTRACK FULL-STACK LAUNCHER
echo      Automated Medication Adherence and Inventory Forecasting
echo      Architecture: Django 5 (Backend/API) + React 19 / Vite (Frontend)
echo =====================================================================
echo.

:: 1. Navigate to script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 2. Check Virtual Environment
if not exist ".venv\Scripts\python.exe" (
    echo [*] Virtual environment not found. Creating .venv...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Ensure Python is installed.
        pause
        exit /b 1
    )
)

:: Ensure pip and required Python dependencies are installed
".venv\Scripts\python.exe" -c "import django" >nul 2>nul
if errorlevel 1 (
    echo [*] Dependencies not found or incomplete. Installing from requirements.txt...
    ".venv\Scripts\python.exe" -m pip install --upgrade pip
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies.
        pause
        exit /b 1
    )
) else (
    echo [OK] Python virtual environment ready.
)

:: 3. Optional: check if user passed "docker" argument
if /i "%1"=="docker" (
    echo [*] Docker Stack Mode requested.
    docker compose up -d
    start "Smart MedTrack - Celery Worker" /d "%SCRIPT_DIR%" cmd /k "call .venv\Scripts\activate.bat && celery -A core worker -l info -P solo"
    start "Smart MedTrack - Celery Beat" /d "%SCRIPT_DIR%" cmd /k "call .venv\Scripts\activate.bat && celery -A core beat -l info"
)

echo.
echo [*] Applying database migrations...
".venv\Scripts\python.exe" manage.py migrate --noinput
if errorlevel 1 (
    echo [ERROR] Database migration failed.
    pause
    exit /b 1
)

:: 4. Check if demo users exist; if not, seed database
echo [*] Checking database seed status...
".venv\Scripts\python.exe" -c "import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); django.setup(); from django.contrib.auth.models import User; exit(0 if User.objects.filter(username='patient1').exists() else 1)" >nul 2>nul
if errorlevel 1 (
    echo [*] Demo data not found. Seeding initial patients, regimens, and inventory...
    ".venv\Scripts\python.exe" manage.py seed_db
) else (
    echo [OK] Database is already initialized with demo patient accounts.
)

:: 5. Check Node.js and frontend dependencies
echo.
echo [*] Checking React frontend dependencies...
if not exist "frontend\node_modules" (
    echo [*] Installing frontend packages - first time setup...
    call npm install --prefix frontend
) else (
    echo [OK] Frontend packages verified.
)

echo.
echo =====================================================================
echo   [OK] FULL-STACK SYSTEM INITIALIZED SUCCESSFULLY!
echo.
echo   Demo Login Accounts:
echo     - Username: patient1    Password: medtrack123   (Ramesh Patel - IST)
echo     - Username: patient2    Password: medtrack123   (Sarah Johnson - EST)
echo.
echo   React Web Application: http://localhost:5173/
echo   Django REST API:       http://127.0.0.1:8000/api/
echo   Django Admin Panel:    http://127.0.0.1:8000/admin/
echo =====================================================================
echo.
echo Starting concurrent services:
echo   [1] Django API Server on http://127.0.0.1:8000/
echo   [2] Vite React Server on http://localhost:5173/
echo.

set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

:: Launch Django server in a dedicated window
start "Smart MedTrack - Django Backend" /d "%SCRIPT_DIR%" cmd /k ".venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

:: Launch Vite React dev server in a dedicated window
start "Smart MedTrack - React Frontend" /d "%FRONTEND_DIR%" cmd /k "npm run dev"

:: Open default browser to React frontend
start http://localhost:5173/

echo [OK] Both servers are launching in separate windows.
echo You can close this launcher window, or press any key to exit.
pause >nul
