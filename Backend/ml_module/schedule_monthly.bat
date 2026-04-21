@echo off
REM schedule_monthly.bat
REM Creates a Windows Task Scheduler task to run the ML monthly update
REM on the 25th of every month at 02:00 AM.
REM Run this ONCE as Administrator.

SET PYTHON=python
SET SCRIPT=%~dp0pipeline.py
SET TASK_NAME=HerbAyur_ML_Monthly_Update

schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "\"%PYTHON%\" \"%SCRIPT%\" --update" ^
  /sc monthly ^
  /d 25 ^
  /st 02:00 ^
  /f

echo.
echo Task "%TASK_NAME%" created.
echo It will run on the 25th of every month at 02:00 AM.
echo To verify: schtasks /query /tn "%TASK_NAME%"
echo To run now: schtasks /run /tn "%TASK_NAME%"
pause
