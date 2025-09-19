@echo off
echo Starting WozaMali App with External Access...
echo.
echo The app will be available at:
echo   - Local:    http://localhost:8080
echo   - Network:  http://192.168.18.239:8080
echo.
echo Other devices on your network can access the app using:
echo   http://192.168.18.239:8080
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev
