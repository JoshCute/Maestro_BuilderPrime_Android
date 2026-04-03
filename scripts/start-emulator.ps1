# scripts/start-emulator.ps1

$emulator = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

Start-Process $emulator -ArgumentList "-avd Pixel_3a_API_34_extension_level_7_x86_64 -no-snapshot -no-boot-anim"

Write-Host "Waiting for device..."
& $adb wait-for-device

do {
    $booted = & $adb shell getprop sys.boot_completed
    Start-Sleep -Seconds 2
} while ($booted -ne "1")

# Unlock screen automatically
& $adb shell input keyevent 82

Write-Host "Emulator ready ✅"