@echo off
cd /d "%~dp0"
if not exist "venv\Scripts\activate.bat" (
    echo [CẢNH BÁO] Chưa tìm thấy venv. Đang tạo môi trường venv...
    call setup_venv.bat
)
call venv\Scripts\activate.bat
cmd /k
