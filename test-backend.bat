@echo off
REM Test if backend can start

cd /d "%~dp0backend"

echo Testing backend startup...
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

REM If uvicorn exited, show the error
echo.
echo Backend exited. Check error messages above.
pause
