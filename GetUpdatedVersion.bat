@echo off
setlocal
:: Project root = folder where this script lives (double-click from Explorer = project root)
set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo FleetPulse Source Export
echo.
echo Collecting project files...

:: Run PowerShell to do the copy and zip (Compress-Archive is built-in)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; " ^
  "$root = '%PROJECT_ROOT%'; " ^
  "$exportDir = Join-Path $root 'FleetPulse_Export'; " ^
  "if (-not (Test-Path $root)) { Write-Error 'Project root not found'; exit 1 }; " ^
  "if (Test-Path $exportDir) { Remove-Item -Recurse -Force $exportDir }; " ^
  "New-Item -ItemType Directory -Path $exportDir | Out-Null; " ^
  "$folders = @('app','components','lib','hooks','public','styles','types','docs','scripts'); " ^
  "foreach ($f in $folders) { " ^
  "  $src = Join-Path $root $f; " ^
  "  if (Test-Path $src -PathType Container) { " ^
  "    Copy-Item -Path $src -Destination (Join-Path $exportDir $f) -Recurse -Force " ^
  "  } " ^
  "}; " ^
  "$files = @('package.json','package-lock.json','tsconfig.json','next.config.js','next.config.mjs','tailwind.config.js','tailwind.config.ts','postcss.config.js','README.md','middleware.js','middleware.ts','next-env.d.ts','.env.example','.env.local.example','.eslintrc.json','.eslintrc.js'); " ^
  "foreach ($f in $files) { " ^
  "  $src = Join-Path $root $f; " ^
  "  if (Test-Path $src -PathType Leaf) { " ^
  "    Copy-Item -Path $src -Destination (Join-Path $exportDir $f) -Force " ^
  "  } " ^
  "}; " ^
  "$zipPath = Join-Path $root 'UpdatedVersion.zip'; " ^
  "Write-Host 'Creating archive...'; " ^
  "Compress-Archive -Path (Join-Path $exportDir '*') -DestinationPath $zipPath -Force; " ^
  "Remove-Item -Recurse -Force $exportDir; " ^
  "Write-Host 'Export complete.'; " ^
  "Write-Host ''; " ^
  "Write-Host 'FleetPulse source export complete. Upload the zip file to ChatGPT for debugging.'; " ^
  "Write-Host ('Saved to: ' + $zipPath)"

endlocal
pause
