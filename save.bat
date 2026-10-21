@echo off
echo Saving code to GitHub...
git add .
git commit -m "Auto Update - %date% %time%"
git push origin main
echo.
echo Done! Code is live on Vercel.
pause
