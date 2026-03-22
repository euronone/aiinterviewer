@echo off
echo [Starting Backend on Port 8002...]
start cmd /k "cd backend && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"

echo [Starting Frontend on Port 3002...]
start cmd /k "cd frontend && npm run dev"

echo [Both services starting...]
