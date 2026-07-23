@echo off
REM Kill all running Lead Hunter processes

echo Killing any existing Python/Node processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

echo Checking what's still listening on ports 8000 and 5173...
netstat -ano | findstr ":8000\|:5173\|:5174"

echo.
echo Done. You can now run start.bat to restart cleanly.
pause
