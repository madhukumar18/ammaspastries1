@echo off
echo ===================================================
echo     Ammas Pastries - Automated Project Setup
echo ===================================================
echo.

REM 1. Backend Setup
echo [1/4] Setting up Laravel Backend...
cd backend
if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
) else (
    echo .env already exists in backend, skipping copy.
)

echo Installing Composer dependencies...
call composer install --no-interaction --prefer-dist
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Composer install failed. Please ensure Composer and PHP 8.2+ are installed.
    exit /b %ERRORLEVEL%
)

echo Generating application key...
call php artisan key:generate --force

echo Creating storage symlink...
call php artisan storage:link

echo Running database migrations and seeder...
call php artisan migrate --seed --force

cd ..

REM 2. Frontend Setup
echo.
echo [2/4] Setting up React Frontend...
cd frontend
if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
) else (
    echo .env already exists in frontend, skipping copy.
)

echo Installing npm dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed. Please ensure Node.js 18+ is installed.
    exit /b %ERRORLEVEL%
)

cd ..

echo.
echo ===================================================
echo   Setup Complete!
echo   To launch the project, double-click run.bat
echo   Or run:
echo     - Backend:  cd backend ^&^& php artisan serve
echo     - Frontend: cd frontend ^&^& npm run dev
echo ===================================================
pause
