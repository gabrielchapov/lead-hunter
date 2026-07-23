@echo off
REM Lead Hunter — Clean start (kills old processes first)

cls
echo.
echo ========================================
echo   Lead Hunter Clean Startup
echo ========================================
echo.

echo Cleaning up old processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend (port 8000)...
start "Lead Hunter - Backend" cmd /k "cd /d %~dp0backend && python -m pip install -q -e . 2>&1 && echo. && echo Backend starting... && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak >nul

echo.
echo Starting frontend (port 5173)...
start "Lead Hunter - Frontend" cmd /k "cd /d %~dp0frontend && npm install -q && npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ✓ Backend should be on http://localhost:8000
echo ✓ Frontend should be on http://localhost:5173
echo.
echo If it doesn't work, check the backend window for errors.
echo.
pause
