@echo off
echo Starting Luxury Affairs Store local server...
echo.
echo The site will open in Chrome at http://localhost:3000
echo Close this window to stop the server.
echo.
start "" "chrome.exe" "http://localhost:3000"
npx serve . -p 3000
