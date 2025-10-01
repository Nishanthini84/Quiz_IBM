@echo off
cls
echo.
echo ========================================
echo   QUIZ WEB APPLICATION
echo ========================================
echo.
echo Starting server...
echo.
echo Server URL: http://localhost:8080
echo.
echo Opening browser automatically...
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

start http://localhost:8080/index.html
python -m http.server 8080

echo.
echo Server stopped.
pause