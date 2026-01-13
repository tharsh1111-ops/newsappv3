@echo off
echo Building WebSmash Standalone Executable...
echo.

python -m PyInstaller newsappv3.spec --noconfirm

echo.
echo Copying README.txt to distribution folder...
copy /Y "README.txt" "dist\WebSmash\README.txt"

echo.
echo Build complete!
echo Executable is in: dist\WebSmash\
echo.
pause
