@echo off
echo OneSeek-7B-Zero – MAXIMAL CHATTPRESTANDA (128 GB RAM)
echo Ryzen AI Max 390 + Radeon 890M + DirectML
echo =================================================

cd /d "%~dp0"

:: Frigör standby-cache (valfritt – lägg i Windows Schemalagda aktiviteter)
:: powershell -command "Clear-StandbyCache" 2>nul

:: Aktivera venv
call backend\python_services\venv\Scripts\activate.bat

:: Starta med MAXIMAL GPU + RAM-användning
start "OneSeek BLIXXNABB" /HIGH /AFFINITY FF ^
    python ml_service/server.py ^
    --auto-devices ^
    --directml ^
    --use-direct ^
    --load-in-4bit ^
    --n-gpu-layers 99 ^
    --gpu-memory 28 ^
    --timeout-keep-alive 600 ^
    --listen ^
    --api

echo.
echo [KLAR] OneSeek kör nu med 28 GB GPU-minne + full iGPU/NPU!
echo        Förväntad svarstid: 1.5–2.8 sekunder
echo        Stäng detta fönster för att stoppa
echo.
pause
