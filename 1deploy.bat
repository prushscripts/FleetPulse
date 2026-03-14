@echo off
cd /d "%~dp0"
echo Push and Deploy - FleetPulse
echo.
echo Staging all changes...
git add .
echo Committing...
git commit -m "Deploy" 2>nul || echo (no changes to commit)
echo Pushing to origin...
git push
echo.
echo Done. Vercel will deploy from the push.
pause
