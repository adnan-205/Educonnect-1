#!/bin/bash

# Jitsi Meet Local Development Startup Script
# ⚠️  WARNING: This is for LOCAL TESTING ONLY!

echo "🚀 Starting Jitsi Meet Local Development Environment..."
echo "⚠️  WARNING: This setup is for LOCAL TESTING ONLY - NOT for production!"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is running"
echo "✅ Docker Compose is available"
echo ""

# Start the services
echo "🔄 Starting Jitsi Meet services..."
docker compose up -d

# Wait a moment for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Jitsi Meet is starting up!"
echo "📱 Access your local Jitsi Meet at: http://localhost"
echo ""
echo "🔍 To view logs: docker compose logs -f"
echo "🛑 To stop: docker compose down"
echo ""
echo "⚠️  Remember: This is for LOCAL TESTING ONLY!"
