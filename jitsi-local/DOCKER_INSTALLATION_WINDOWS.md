# Docker Desktop Installation Guide for Windows

> ⚠️ **WARNING: This Jitsi setup is for LOCAL TESTING ONLY!**

## 📋 Prerequisites

Before installing Docker Desktop, ensure your system meets these requirements:

### Windows Editions Supported:
- Windows 11 64-bit: Home, Pro, Enterprise, or Education
- Windows 10 64-bit: Home, Pro, Enterprise, or Education

### System Requirements:
- **Windows 10/11**: Updated to version 2004 or higher (Build 19041 or higher)
- **WSL 2**: Required for Docker Desktop on Windows
- **RAM**: At least 4GB (8GB recommended)
- **CPU**: 64-bit processor with Second Level Address Translation (SLAT)
- **Storage**: At least 4GB of available disk space

## 🔧 Installation Steps

### Step 1: Enable WSL 2

1. Open PowerShell as Administrator
2. Run the following command:
   ```powershell
   wsl --install
   ```

3. This command will:
   - Enable the WSL features
   - Download and install the latest Linux kernel
   - Set WSL 2 as the default version
   - Download and install Ubuntu Linux distribution

4. Restart your computer when prompted

### Step 2: Install Docker Desktop

1. Download Docker Desktop for Windows:
   - Go to [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - Click "Download Docker Desktop"

2. Run the installer:
   - Double-click the downloaded `.exe` file
   - Follow the installation wizard
   - Make sure to check "Add Docker Desktop to PATH" during installation

3. Restart your computer after installation

### Step 3: Verify Installation

1. Open PowerShell or Command Prompt (not as Administrator)
2. Run these commands:
   ```cmd
   docker --version
   docker compose --version
   ```

3. You should see output similar to:
   ```
   Docker version 24.0.x, build xxxxxxx
   Docker Compose version v2.20.x
   ```

### Step 4: Start Docker Desktop

1. Search for "Docker Desktop" in the Start menu
2. Launch Docker Desktop
3. Wait for the Docker whale icon to appear in your system tray
4. The icon should be steady (not animated) when Docker is fully running

## 🚀 Running Jitsi Meet

### After Docker Installation:

1. Open PowerShell or Command Prompt
2. Navigate to the jitsi-local directory:
   ```cmd
   cd "c:\Users\iqbal\OneDrive\Desktop\mern-stack\Educonnect\Educonnect-1-3\jitsi-local"
   ```

3. Start Jitsi Meet services:
   ```cmd
   docker compose up -d
   ```

4. Check if services are running:
   ```cmd
   docker compose ps
   ```

5. Access Jitsi Meet in your browser:
   ```
   http://localhost
   ```

## 🔍 Troubleshooting Docker Installation

### Common Issues:

#### 1. Docker Command Not Found
If you get errors like "The term 'docker' is not recognized":
- Make sure Docker Desktop is installed and running
- Restart your terminal/PowerShell
- Check if Docker is in your PATH:
  ```cmd
  echo $env:PATH
  ```

#### 2. WSL 2 Not Available
If you get WSL 2 related errors:
- Ensure Windows is updated to the latest version
- Manually install WSL 2:
  ```powershell
  # Enable WSL feature
  dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
  
  # Enable Virtual Machine feature
  dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
  
  # Set WSL 2 as default
  wsl --set-default-version 2
  ```

#### 3. Docker Desktop Won't Start
- Check Windows features: Enable "Hyper-V" and "Windows Hypervisor Platform"
- Ensure virtualization is enabled in BIOS/UEFI settings
- Try running Docker Desktop as Administrator

## 🛠 Docker Management Commands

Once Docker is installed and running:

### View Service Status
```cmd
docker compose ps
```

### View Logs
```cmd
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
```cmd
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### Restart Services
```cmd
# Restart all services
docker compose restart

# Restart specific service
docker compose restart web
```

### Update Images
```cmd
# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d --force-recreate
```

## ⚠️ Important Notes

### For Windows Users:
- Docker Desktop for Windows includes Docker Compose by default
- WSL 2 backend is recommended for better performance
- Make sure Docker Desktop is running before executing any docker commands

### Security Warning:
> ⚠️ **WARNING: This Jitsi setup is for LOCAL TESTING ONLY!**
> - Uses insecure default passwords
> - Disables HTTPS
> - No authentication required
> - Not suitable for production use

## 📚 Additional Resources

- [Docker Desktop for Windows Documentation](https://docs.docker.com/desktop/windows/)
- [WSL 2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Jitsi Meet Docker Repository](https://github.com/jitsi/docker-jitsi-meet)

## 🐛 Getting Help

If Docker Desktop won't install or run:
1. Check the [Docker Desktop Troubleshooting Guide](https://docs.docker.com/desktop/troubleshoot/)
2. Verify Windows version and updates
3. Ensure virtualization is enabled in BIOS
4. Check Windows features (Hyper-V, WSL, etc.)
5. Restart your computer after making system changes
