#!/bin/bash

# EduConnect DigitalOcean Deployment Script
# This script automates the deployment process on DigitalOcean

set -e

echo "🚀 EduConnect DigitalOcean Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}⚠️  Running as root. Consider using a non-root user.${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first:"
    echo "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Load environment variables
source .env

# Check critical environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}❌ Error: $1 is not set in .env file${NC}"
        exit 1
    fi
}

echo "🔍 Checking critical environment variables..."
check_env_var "JWT_SECRET"
check_env_var "JWT_REFRESH_SECRET"
check_env_var "NEXTAUTH_SECRET"
check_env_var "MONGO_ROOT_PASSWORD"

# Check Jitsi configuration
if [ -z "$JITSI_DOCKER_HOST_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Warning: JITSI_DOCKER_HOST_ADDRESS is not set${NC}"
    echo "Getting server IP address..."
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
    echo -e "${YELLOW}Detected IP: $SERVER_IP${NC}"
    echo "Please set JITSI_DOCKER_HOST_ADDRESS=$SERVER_IP in your .env file"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Environment variables check passed${NC}"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker compose pull

# Build images
echo "🔨 Building Docker images..."
docker compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check MongoDB
if docker compose exec -T mongodb mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB is not responding${NC}"
fi

# Check Backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed (may still be starting)${NC}"
fi

# Check Jitsi
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Jitsi is running${NC}"
else
    echo -e "${YELLOW}⚠️  Jitsi health check failed (may still be starting)${NC}"
fi

# Show service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "📍 Service URLs:"
echo "  Backend API: http://localhost:5000"
echo "  Frontend:    http://localhost:3000"
echo "  Jitsi Meet:  http://localhost:8080"
echo "  Health:      http://localhost:5000/health"
echo ""
echo "📝 Useful commands:"
echo "  View logs:    docker compose logs -f"
echo "  Stop:         docker compose down"
echo "  Restart:      docker compose restart"
echo "  Status:       docker compose ps"
echo ""



