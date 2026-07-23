@echo off
REM Lead Hunter — one-click start for Windows.
REM Opens backend (port 8000) + frontend (port 5173), then opens the app in your browser.
REM Keep this window open while working; close it to stop both servers.

cls
echo.
echo ========================================
echo   Lead Hunter Startup
echo ========================================
echo.

echo Step 1: Starting backend (port 8000)...
start "Lead Hunter - Backend" cmd /k "cd /d %~dp0backend && python -m pip install -q -e . && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting 4 seconds for backend to initialize...
timeout /t 4 /nobreak >nul

echo Step 2: Starting frontend (port 5173)...
start "Lead Hunter - Frontend" cmd /k "cd /d %~dp0frontend && npm install -q && npm run dev"

echo Waiting 8 seconds for frontend to build...
timeout /t 8 /nobreak >nul

echo Step 3: Opening http://localhost:5173 in your browser...
start http://localhost:5173

echo.
echo ✓ Done! Two windows should be running:
echo   - Lead Hunter - Backend (port 8000)
echo   - Lead Hunter - Frontend (port 5173)
echo.
echo If the app doesn't load, check both windows for errors.
echo Close this window to stop all servers.
echo.
timeout /t 3 /nobreak >nul
