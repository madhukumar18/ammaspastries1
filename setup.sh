#!/usr/bin/env bash
set -e

echo "==================================================="
echo "    Ammas Pastries - Automated Project Setup"
echo "==================================================="
echo ""

# 1. Backend Setup
echo "[1/4] Setting up Laravel Backend..."
cd backend
if [ ! -f .env ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
else
    echo ".env already exists in backend, skipping copy."
fi

echo "Installing Composer dependencies..."
composer install --no-interaction --prefer-dist

echo "Generating application key..."
php artisan key:generate --force

echo "Creating storage symlink..."
php artisan storage:link

echo "Running database migrations and seeder..."
php artisan migrate --seed --force

cd ..

# 2. Frontend Setup
echo ""
echo "[2/4] Setting up React Frontend..."
cd frontend
if [ ! -f .env ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
else
    echo ".env already exists in frontend, skipping copy."
fi

echo "Installing npm dependencies..."
npm install

cd ..

echo ""
echo "==================================================="
echo "  Setup Complete!"
echo "  To launch the project, run: ./run.sh"
echo "  Or run in separate terminals:"
echo "    - Backend:  cd backend && php artisan serve"
echo "    - Frontend: cd frontend && npm run dev"
echo "==================================================="
