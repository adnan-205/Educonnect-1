@echo off
REM Jitsi Meet Local Development Startup Script for Windows
REM WARNING: This is for LOCAL TESTING ONLY!

echo.
echo 🚀 Starting Jitsi Meet Local Development Environment...
echo ⚠️  WARNING: This setup is for LOCAL TESTING ONLY - NOT for production!
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available. Please install Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo ✅ Docker Compose is available
echo.

REM Start the services
echo 🔄 Starting Jitsi Meet services...
docker compose up -d

REM Wait a moment for services to start
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service status
echo.
echo 📊 Service Status:
docker compose ps

echo.
echo 🎉 Jitsi Meet is starting up!
echo 📱 Access your local Jitsi Meet at: http://localhost
echo.
echo 🔍 To view logs: docker compose logs -f
echo 🛑 To stop: docker compose down
echo.
echo ⚠️  Remember: This is for LOCAL TESTING ONLY!
echo.
pause
