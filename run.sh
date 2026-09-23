#!/usr/bin/env bash

echo "==================================================="
echo "    Ammas Pastries - Starting Development Servers"
echo "==================================================="
echo ""
echo "Starting Laravel Backend on http://127.0.0.1:8000 ..."
(cd backend && php artisan serve --port=8000) &
BACKEND_PID=$!

echo "Starting React Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Servers running!"
echo "- Storefront:   http://localhost:5173"
echo "- Admin Panel:  http://localhost:5173/admin/login"
echo "- Backend API:  http://127.0.0.1:8000/api"
echo ""
echo "Press [CTRL+C] to stop all servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
