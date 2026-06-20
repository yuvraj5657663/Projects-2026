Param(
    [string]$file = ".\audio\reminder.mp3",
    [int]$durationSeconds = 300
)

if (-not (Test-Path $file)) {
    Write-Error "Audio file not found: $file"
    exit 1
}

$full = (Resolve-Path $file).Path
$player = New-Object -ComObject WMPlayer.OCX
$player.URL = $full
$player.controls.play()
Start-Sleep -Seconds $durationSeconds
try { $player.controls.stop() } catch {}
