@echo off
setlocal
set "BASEDIR=%~dp0"
set "PHPEXE=%BASEDIR%php-runtime\php.exe"
set "PHPINI=%BASEDIR%php-runtime\php.ini"
set "EXTDIR=%BASEDIR%php-runtime\ext"
set "APPDIR=%BASEDIR%app"

echo Starting BMC in debug mode - any error will print below and stay on screen.
echo.
cd /d "%APPDIR%"
"%PHPEXE%" -c "%PHPINI%" -d extension_dir="%EXTDIR%" artisan serve --host=0.0.0.0 --port=8000

echo.
echo Server stopped or crashed - see any error above.
pause
