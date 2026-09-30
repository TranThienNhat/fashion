@echo off
chcp 65001 >nul
echo =========================================================================
echo  [FASHION E-COMMERCE] THIẾT LẬP MÔI TRƯỜNG ẢO VENV CHO BACKEND
echo =========================================================================

cd /d "%~dp0"

echo [1/4] Đang dọn dẹp các thư mục cache thừa (__pycache__, *.pyc)...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul
del /s /q *.pyc 2>nul
echo  ✓ Đã dọn dẹp cache sạch sẽ.

echo.
echo [2/4] Đang kiểm tra và khởi tạo môi trường ảo Python venv...
if not exist "venv\Scripts\python.exe" (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Không thể tạo venv. Vui lòng đảm bảo Python đã được cài đặt và có trong PATH.
        pause
        exit /b 1
    )
    echo  ✓ Đã tạo thành công thư mục môi trường ảo venv.
) else (
    echo  ✓ Thư mục venv đã tồn tại sẵn tại fashion_be\venv.
)

echo.
echo [3/4] Đang cài đặt các thư viện từ requirements.txt vào venv...
venv\Scripts\python.exe -m pip install --upgrade pip --quiet
venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Cài đặt thư viện thất bại.
    pause
    exit /b 1
)
echo  ✓ Đã cài đặt đầy đủ tất cả thư viện vào venv độc lập.

echo.
echo [4/4] Kiểm tra các gói đã cài trong venv:
echo -------------------------------------------------------------------------
venv\Scripts\python.exe -m pip list
echo -------------------------------------------------------------------------

echo.
echo [HOÀN TẤT] Môi trường venv đã sẵn sàng!
echo Thư mục 'venv' đã được cấu hình trong .gitignore, hoàn toàn không bị đẩy lên Git.
echo.
echo Để khởi chạy Backend với venv, hãy chạy file: run_backend.bat
echo =========================================================================
pause
