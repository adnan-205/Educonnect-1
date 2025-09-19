# Jitsi Meet Local Development Setup

> ⚠️ **WARNING: This setup is for LOCAL TESTING ONLY!**  
> **DO NOT use this configuration in production environments.**  
> This setup uses insecure passwords, disabled HTTPS, and other configurations that are NOT suitable for production use.

## 📋 Overview

This Docker Compose setup allows you to run Jitsi Meet locally for development and testing purposes. It includes all the necessary components:

- **Web**: Jitsi Meet web interface
- **Prosody**: XMPP server for signaling
- **Jicofo**: Jitsi Conference Focus component
- **JVB**: Jitsi Videobridge for media routing

## 🔧 Prerequisites

### Install Docker and Docker Compose

#### Ubuntu/Debian
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Install Docker Compose
sudo apt install -y docker compose

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Verify installation
docker --version
docker compose --version
```

#### Windows
Please follow the detailed [Windows Docker Installation Guide](DOCKER_INSTALLATION_WINDOWS.md) for step-by-step instructions.

1. **Enable WSL 2**: Open PowerShell as Administrator and run `wsl --install`
2. **Download Docker Desktop**: Go to [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
3. **Install Docker Desktop**: Run the installer and follow the setup wizard
4. **Restart**: Restart your computer after installation
5. **Start Docker Desktop**: Launch Docker Desktop from the Start menu
6. **Verify**: Open PowerShell or Command Prompt and run:
   ```cmd
   docker --version
   docker compose --version
   ```

#### macOS
1. **Download Docker Desktop**: Go to [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. **Install Docker Desktop**: Drag Docker to Applications folder
3. **Launch Docker**: Open Docker from Applications
4. **Verify**: Open Terminal and run:
   ```bash
   docker --version
   docker compose --version
   ```

## 🚀 Quick Start

### 1. Clone or Download This Setup
```bash
# If you have this as part of a git repository
cd jitsi-local

# Or create the directory and add the files manually
mkdir jitsi-local
cd jitsi-local
# Then add the .env and docker compose.yml files
```

### 2. Start Jitsi Meet
```bash
# Start all services in detached mode
docker compose up -d

# Check if all services are running
docker compose ps

# View logs (optional)
docker compose logs -f
```

### 3. Access Jitsi Meet
Open your web browser and navigate to:
```
http://localhost
```

### 4. Create a Meeting
1. Enter a room name in the input field
2. Click "GO" or press Enter
3. Allow camera and microphone permissions when prompted
4. Start your meeting!

## 🛠 Management Commands

### View Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs web
docker compose logs prosody
docker compose logs jicofo
docker compose logs jvb

# Follow logs in real-time
docker compose logs -f
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart web
```

### Update Images
```bash
# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d --force-recreate
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
If you get an error about ports 80 or 443 being in use:
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop the conflicting service or change ports in docker compose.yml
```

#### 2. Services Not Starting
```bash
# Check logs for errors
docker compose logs

# Check system resources
docker system df
docker system prune  # Clean up if needed
```

#### 3. Can't Access Jitsi at localhost
- Make sure all services are running: `docker compose ps`
- Check if port 80 is accessible: `curl http://localhost`
- Try accessing via IP: `http://127.0.0.1`
- Check firewall settings

#### 4. Audio/Video Issues
- Ensure your browser has camera/microphone permissions
- Try a different browser (Chrome/Firefox recommended)
- Check browser console for errors (F12 → Console)

### Reset Everything
If you encounter persistent issues:
```bash
# Stop and remove everything
docker compose down -v

# Remove all Jitsi-related containers and images
docker system prune -a

# Start fresh
docker compose up -d
```

## 📁 File Structure
```
jitsi-local/
├── .env                 # Environment configuration
├── docker compose.yml   # Docker services definition
└── README.md           # This file
```

## 🔧 Configuration

### Environment Variables (.env)
Key configuration options in the `.env` file:

- `PUBLIC_URL=http://localhost` - Base URL for Jitsi
- `DISABLE_HTTPS=1` - Disable HTTPS for local testing
- `ENABLE_AUTH=0` - Disable authentication (anyone can create rooms)
- `ENABLE_GUESTS=1` - Allow guest users
- `TZ=UTC` - Timezone setting

### Port Mappings
- `80:80` - Web interface (HTTP)
- `443:443` - Web interface (HTTPS, disabled in local setup)
- `10000:10000/udp` - JVB media port

## 🔒 Security Notice

> ⚠️ **IMPORTANT SECURITY WARNING**

This setup is configured for **LOCAL DEVELOPMENT ONLY** and includes several security compromises:

- **Disabled HTTPS**: All traffic is unencrypted
- **Weak passwords**: Default passwords are used for internal components
- **No authentication**: Anyone can create and join meetings
- **Open access**: No rate limiting or access controls

**Never use this configuration in production!**

For production deployment, refer to the [official Jitsi Meet documentation](https://jitsi.github.io/handbook/docs/devops-guide/).

## 📚 Additional Resources

- [Official Jitsi Meet Documentation](https://jitsi.github.io/handbook/)
- [Jitsi Docker Repository](https://github.com/jitsi/docker-jitsi-meet)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🐛 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `docker compose logs`
3. Consult the [official Jitsi documentation](https://jitsi.github.io/handbook/)
4. Check the [Jitsi Community Forum](https://community.jitsi.org/)

## 📝 License

This setup uses the official Jitsi Meet Docker images, which are subject to their respective licenses. Please refer to the [Jitsi Meet repository](https://github.com/jitsi/jitsi-meet) for license information.
