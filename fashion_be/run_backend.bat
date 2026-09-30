@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo =========================================================================
echo  [FASHION E-COMMERCE] KHỞI CHẠY BACKEND FLASK VỚI MÔI TRƯỜNG VENV
echo =========================================================================

if not exist "venv\Scripts\python.exe" (
    echo [CẢNH BÁO] Chưa tìm thấy venv! Đang tự động tiến hành khởi tạo...
    call setup_venv.bat
)

echo [START] Đang chạy Flask API Backend trên http://127.0.0.1:5000 bằng venv...
venv\Scripts\python.exe app.py
pause
