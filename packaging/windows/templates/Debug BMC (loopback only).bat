@echo off
setlocal
set "BASEDIR=%~dp0"
set "PHPEXE=%BASEDIR%php-runtime\php.exe"
set "PHPINI=%BASEDIR%php-runtime\php.ini"
set "EXTDIR=%BASEDIR%php-runtime\ext"
set "APPDIR=%BASEDIR%app"

echo Starting BMC in debug mode on 127.0.0.1:8000 (loopback only) - any error will print below.
echo.
cd /d "%APPDIR%"
"%PHPEXE%" -c "%PHPINI%" -d extension_dir="%EXTDIR%" artisan serve --host=127.0.0.1 --port=8000

echo.
echo Server stopped or crashed - see any error above.
pause
