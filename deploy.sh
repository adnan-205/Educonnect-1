#!/bin/bash

# EduConnect Production Deployment Script
set -e

echo "🚀 Starting EduConnect Production Deployment..."

# Check if required environment variables are set
check_env_vars() {
    local required_vars=(
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "NEXTAUTH_SECRET"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Error: $var environment variable is not set"
            exit 1
        fi
    done
    echo "✅ All required environment variables are set"
}

# Build and deploy with Docker Compose
deploy_with_docker() {
    echo "📦 Building Docker images..."
    docker-compose build --no-cache
    
    echo "🔄 Starting services..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "Up (healthy)"; then
        echo "✅ All services are running and healthy"
    else
        echo "❌ Some services are not healthy"
        docker-compose logs
        exit 1
    fi
}

# Deploy without Docker (traditional deployment)
deploy_traditional() {
    echo "📦 Installing backend dependencies..."
    cd backend
    npm ci --only=production
    npm run build
    
    echo "📦 Installing frontend dependencies..."
    cd ../frontend
    npm ci --only=production
    npm run build
    
    echo "🔄 Starting services with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
}

# Main deployment logic
main() {
    echo "🔍 Checking environment variables..."
    check_env_vars
    
    if command -v docker-compose &> /dev/null; then
        echo "🐳 Docker Compose found, deploying with containers..."
        deploy_with_docker
    elif command -v pm2 &> /dev/null; then
        echo "📱 PM2 found, deploying traditionally..."
        deploy_traditional
    else
        echo "❌ Neither Docker Compose nor PM2 found. Please install one of them."
        exit 1
    fi
    
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "📊 Health Check: http://localhost:5000/health"
}

# Run main function
main "$@"
