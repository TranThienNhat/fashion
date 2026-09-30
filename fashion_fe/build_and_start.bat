@echo off
cd /d "%~dp0"
echo Dang build lai Next.js voi cac ban sua loi moi nhat...
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo Build thanh cong! Dang khoi dong Next.js Production...
    npm start
) else (
    echo Build that bai, vui long kiem tra loi tren man hinh!
)
pause
