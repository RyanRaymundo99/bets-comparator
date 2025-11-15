@echo off
echo ========================================
echo  Bets Comparator - Setup Script
echo ========================================
echo.

echo [1/5] Cleaning up old files...
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
if exist prisma\generated rmdir /s /q prisma\generated

echo.
echo [2/5] Installing dependencies...
call npm install

echo.
echo [3/5] Generating Prisma Client...
call npx prisma generate

echo.
echo [4/5] Checking environment variables...
if not exist .env.local (
    echo WARNING: .env.local not found!
    echo Please copy env.example to .env.local and configure it.
    echo.
) else (
    echo .env.local found ✓
)

echo.
echo [5/5] Setup complete!
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo 1. Configure .env.local with your credentials
echo 2. Run: npx prisma db push
echo 3. Run: npm run dev
echo 4. Access: http://localhost:3000
echo ========================================
echo.
pause

