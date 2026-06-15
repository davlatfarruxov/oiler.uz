@echo off
setlocal

REM ================================================================
REM  OILER.UZ — Kiosk monitor sozlamasi
REM  Mijoz kompyuterida bir marta ishga tushiring
REM ================================================================

REM ---- SOZLAMALAR (kerak bo'lsa o'zgartiring) ----
set "KIOSK_URL=https://oiler.uz/kiosk?fullscreen=1"

REM Birinchi monitor kengligi:
REM   Full HD  = 1920
REM   2K (QHD) = 2560
REM   4K       = 3840
set "FIRST_MONITOR_WIDTH=1920"

REM Ikkinchi monitor vertikal pozitsiyasi (odatda 0)
set "SECOND_SCREEN_Y=0"

REM Alohida kiosk profil (asosiy brauzer bilan to'qnashmaydi)
set "KIOSK_PROFILE=C:\kiosk-profile"
REM ------------------------------------------------

set /a SECOND_SCREEN_X=%FIRST_MONITOR_WIDTH%

set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "EDGE_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME_EXE%" (
  start "" "%CHROME_EXE%" ^
    --kiosk "%KIOSK_URL%" ^
    --window-position=%SECOND_SCREEN_X%,%SECOND_SCREEN_Y% ^
    --user-data-dir="%KIOSK_PROFILE%\chrome"
  goto :autostart
)

if exist "%EDGE_EXE%" (
  start "" "%EDGE_EXE%" ^
    --kiosk "%KIOSK_URL%" ^
    --window-position=%SECOND_SCREEN_X%,%SECOND_SCREEN_Y% ^
    --user-data-dir="%KIOSK_PROFILE%\edge"
  goto :autostart
)

echo XATO: Chrome yoki Edge topilmadi.
pause
goto :eof

:autostart
REM Autostart'ga qo'shishni taklif qilish
echo.
echo Kiosk muvaffaqiyatli ochildi!
echo.
set /p ADD_AUTOSTART="Kompyuter yonganda avtomatik ochilsinmi? (ha/yo'q): "
if /i "%ADD_AUTOSTART%"=="ha" (
  set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
  copy "%~f0" "%STARTUP_DIR%\kiosk-oiler.bat" >nul
  echo Autostart'ga qo'shildi: %STARTUP_DIR%\kiosk-oiler.bat
) else (
  echo Autostart'ga qo'shilmadi.
)
echo.
pause
