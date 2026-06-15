# ---- CONFIG ----
$url        = "http://localhost:3001/kiosk"
$profileDir = "C:\kiosk-chrome-profile\chrome"
$screenX    = 1920   # birinchi monitor kengligi
$screenY    = 0
$screenW    = 1920   # ikkinchi monitor kengligi
$screenH    = 1080   # ikkinchi monitor balandligi
# ----------------

$chromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$edgeExe   = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if (Test-Path $chromeExe) {
    $browserExe = $chromeExe
    $profilePath = "C:\kiosk-chrome-profile\chrome"
} elseif (Test-Path $edgeExe) {
    $browserExe = $edgeExe
    $profilePath = "C:\kiosk-chrome-profile\edge"
} else {
    Write-Host "XATO: Chrome yoki Edge topilmadi."
    Read-Host
    exit 1
}

# Win32 API
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const int  SW_MAXIMIZE    = 3;
}
"@

# Chrome'ni ochish (--app: address bar yo'q)
$proc = Start-Process $browserExe `
    -ArgumentList "--app=`"$url`"", "--user-data-dir=`"$profilePath`"" `
    -PassThru

# Oyna ochilishini kutish (max 10 soniya)
$hwnd = [IntPtr]::Zero
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    $p = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
    if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
        $hwnd = $p.MainWindowHandle
        break
    }
}

if ($hwnd -eq [IntPtr]::Zero) {
    Write-Host "XATO: Chrome oynasi topilmadi."
    exit 1
}

# Oynani ikkinchi monitorda joylashtirish
[Win32]::SetWindowPos($hwnd, [IntPtr]::Zero, $screenX, $screenY, $screenW, $screenH, [Win32]::SWP_SHOWWINDOW) | Out-Null
Start-Sleep -Milliseconds 400

# Fokusga olish va fullscreen (F11)
[Win32]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 300
[Win32]::keybd_event(0x7A, 0, 0, [UIntPtr]::Zero)       # F11 bosish
[Win32]::keybd_event(0x7A, 0, 0x0002, [UIntPtr]::Zero)  # F11 qo'yish
