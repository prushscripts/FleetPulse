@echo off
REM Generate fleetpulse_poster.png from frame 45 of the logo video.
set FFMPEG="C:\Users\James\Desktop\WQ Advaned\com.wasp-launcher.app\Simba\Plugins\wasp-plugins\librecorder\ffmpeg.exe"
cd /d "%~dp0.."
%FFMPEG% -i public/assets/fleetpulse_logo_loop.mp4 -vf "select=eq(n\,45)" -vframes 1 public/assets/fleetpulse_poster.png
echo.
if exist public\assets\fleetpulse_poster.png (echo Poster created: public/assets/fleetpulse_poster.png) else (echo Failed. Is ffmpeg installed and in PATH?)
pause
