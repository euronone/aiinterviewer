@echo off
echo [Setting up Backend...]
cd backend
python -m venv venv
call .\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo [Setting up Frontend...]
cd frontend
npm install
cd ..

echo [Setup Complete!]
pause
