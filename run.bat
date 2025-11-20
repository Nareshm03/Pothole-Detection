@echo off
echo Starting SmoothTrack Pothole Detection System...
echo.

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask server...
echo Open your browser and go to: http://localhost:5000
echo.

python app.py