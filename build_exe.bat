@echo off
echo Building NewsAppV3 Standalone Executable...
echo.

python -m PyInstaller newsappv3.spec --clean --noconfirm

echo.
echo Build complete!
echo Executable is in: dist\NewsAppV3\
echo.
pause
