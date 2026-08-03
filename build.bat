@echo off
echo ========================================================
echo  VibePad Desktop Executable Build System
echo ========================================================
echo.

echo [1/3] Cleaning obsolete temporary files...
if exist build rmdir /s /q build 2>nul
if exist .tmp rmdir /s /q .tmp 2>nul
if exist neutralino.config.json del /f /q neutralino.config.json 2>nul
if exist neutralino.js del /f /q neutralino.js 2>nul
if exist neutralinojs.log del /f /q neutralinojs.log 2>nul
if exist resources.neu del /f /q resources.neu 2>nul

echo [2/3] Building Vite web bundle and packaging Electrobun EXE...
node scripts/build-exe.js
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo.
echo [3/3] Registering Windows 11 / 10 Explorer context menus and icons...
node scripts/register-windows.js
if %errorlevel% neq 0 (
    echo Windows Registry registration failed!
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo  BUILD COMPLETE! 
echo  Final production bundle ready at:
echo  - dist\
echo  - release\VibePad-win-x64\
echo ========================================================
