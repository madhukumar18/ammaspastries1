@echo off
echo ===================================================
echo     Ammas Pastries - Starting Development Servers
echo ===================================================
echo.
echo Starting Laravel Backend on http://127.0.0.1:8000 ...
start "Ammas Backend Server (Port 8000)" cmd /k "cd backend && php artisan serve --port=8000"

echo Starting React Frontend on http://localhost:5173 ...
start "Ammas Frontend Server (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Storefront:   http://localhost:5173
echo - Admin Panel:  http://localhost:5173/admin/login
echo - Backend API:  http://127.0.0.1:8000/api
echo.
