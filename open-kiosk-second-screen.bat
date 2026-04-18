@echo off
setlocal

REM ---- CONFIG ----
set "KIOSK_URL=http://localhost:3001/kiosk"
set "SECOND_SCREEN_X=1920"
set "SECOND_SCREEN_Y=0"
set "SECOND_SCREEN_W=1920"
set "SECOND_SCREEN_H=1080"
set "SCALE_FACTOR=1.5"
REM ---------------

set "EDGE_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"

if exist "%EDGE_EXE%" (
  start "" "%EDGE_EXE%" ^
    --new-window ^
    --kiosk "%KIOSK_URL%" ^
    --window-position=%SECOND_SCREEN_X%,%SECOND_SCREEN_Y% ^
    --window-size=%SECOND_SCREEN_W%,%SECOND_SCREEN_H% ^
    --force-device-scale-factor=%SCALE_FACTOR%
  goto :eof
)

if exist "%CHROME_EXE%" (
  start "" "%CHROME_EXE%" ^
    --new-window ^
    --kiosk "%KIOSK_URL%" ^
    --window-position=%SECOND_SCREEN_X%,%SECOND_SCREEN_Y% ^
    --window-size=%SECOND_SCREEN_W%,%SECOND_SCREEN_H% ^
    --force-device-scale-factor=%SCALE_FACTOR%
  goto :eof
)

echo Edge yoki Chrome topilmadi.
echo EDGE path: %EDGE_EXE%
echo CHROME path: %CHROME_EXE%
pause
