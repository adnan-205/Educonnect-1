# 🎥 Self-Hosted Jitsi Meet Setup Guide

This guide explains how EduConnect uses self-hosted Jitsi Meet for video conferencing.

## 📋 Overview

EduConnect now supports **self-hosted Jitsi Meet**, allowing you to run video conferencing on your own server instead of using the public `meet.jit.si` instance. This provides:

- ✅ **Full Control**: Complete control over your video infrastructure
- ✅ **Privacy**: All video traffic stays on your server
- ✅ **Customization**: Custom branding and configuration
- ✅ **No Limits**: No rate limits or restrictions from public service
- ✅ **Unique Room IDs**: Each class gets a unique, secure room ID

## 🏗️ Architecture

### Room ID Generation

Each class (booking) gets a **unique room ID** when the teacher accepts the booking:

```
Format: educonnect-{gigTitleSlug}-{bookingId}-{random16}

Example: educonnect-advanced-math-tutoring-507f1f77bcf86cd799439011-a3f5b2c1d4e6f7a8
```

**Components:**
- `educonnect-` - Prefix for identification
- `{gigTitleSlug}` - Slugified class title (e.g., "Advanced Math Tutoring" → "advanced-math-tutoring")
- `{bookingId}` - Unique MongoDB ObjectId for the booking
- `{random16}` - 16-character random hex string for additional security

This ensures:
- ✅ **Uniqueness**: Each booking gets a unique room
- ✅ **Security**: Random component prevents guessing
- ✅ **Readability**: Includes class title for easy identification

### How It Works

1. **Student creates booking** → Booking stored in database
2. **Teacher accepts booking** → System generates unique room ID
3. **Room ID stored** → Saved in `booking.meetingRoomId` field
4. **Meeting link created** → Link points to your self-hosted Jitsi instance
5. **Students/Teachers join** → Use room ID to join the meeting

## 🔧 Configuration

### Backend Configuration

Set `JITSI_DOMAIN` in `backend/.env`:

```env
# For production with domain
JITSI_DOMAIN=meet.yourdomain.com

# For local testing
JITSI_DOMAIN=localhost:8080

# For production with IP (not recommended)
JITSI_DOMAIN=YOUR_SERVER_IP:8080
```

### Frontend Configuration

Set `NEXT_PUBLIC_JITSI_DOMAIN` in `frontend/.env.local`:

```env
# Must match backend JITSI_DOMAIN
NEXT_PUBLIC_JITSI_DOMAIN=meet.yourdomain.com
```

### Docker Compose Configuration

Jitsi services are included in the main `docker-compose.yml`:

```yaml
services:
  jitsi-web:      # Web interface
  jitsi-prosody:  # XMPP server
  jitsi-jicofo:   # Conference focus
  jitsi-jvb:      # Video bridge
```

Configure via environment variables in root `.env`:

```env
# Domain Configuration
JITSI_DOMAIN=meet.yourdomain.com
JITSI_PUBLIC_URL=https://meet.yourdomain.com

# Critical: Set to your server's public IP
JITSI_DOCKER_HOST_ADDRESS=YOUR_SERVER_IP

# Security Secrets (generate with: openssl rand -hex 16)
JITSI_JICOFO_COMPONENT_SECRET=...
JITSI_JICOFO_AUTH_PASSWORD=...
JITSI_JVB_AUTH_PASSWORD=...
```

## 🚀 Deployment Options

### Option 1: Integrated with Main Stack (Recommended)

Jitsi is included in the main `docker-compose.yml`. Just start all services:

```bash
docker compose up -d
```

**Pros:**
- ✅ Single command to start everything
- ✅ Shared network for easy communication
- ✅ Unified logging and monitoring

### Option 2: Separate Jitsi Stack

Use the separate `jitsi-production/docker-compose.yml`:

```bash
cd jitsi-production
docker compose up -d
```

**Pros:**
- ✅ Isolated from main application
- ✅ Can scale independently
- ✅ Easier to manage separately

## 🔒 Security Configuration

### Open Access (Default for Development)

```env
JITSI_ENABLE_AUTH=0
JITSI_ENABLE_GUESTS=1
```

**Use when:**
- Development/testing
- Internal network only
- Trusted users only

### Authentication Required (Recommended for Production)

```env
JITSI_ENABLE_AUTH=1
JITSI_ENABLE_GUESTS=0
```

**Use when:**
- Production deployment
- Public-facing server
- Need user authentication

### JWT Authentication (Advanced)

For advanced authentication, configure JWT:

```env
JITSI_JWT_APP_ID=your-app-id
JITSI_JWT_APP_SECRET=your-jwt-secret
JITSI_JWT_ACCEPTED_ISSUERS=yourdomain.com
JITSI_JWT_ACCEPTED_AUDIENCES=your-app-name
```

## 🌐 Domain Setup

### With Domain Name (Recommended)

1. **Add DNS A Record**:
   ```
   meet.yourdomain.com → YOUR_SERVER_IP
   ```

2. **Configure Environment**:
   ```env
   JITSI_DOMAIN=meet.yourdomain.com
   JITSI_PUBLIC_URL=https://meet.yourdomain.com
   ```

3. **Enable SSL**:
   ```env
   JITSI_ENABLE_LETSENCRYPT=1
   JITSI_LETSENCRYPT_EMAIL=your-email@example.com
   ```

### Without Domain (Testing Only)

1. **Use IP Address**:
   ```env
   JITSI_DOMAIN=YOUR_SERVER_IP:8080
   JITSI_PUBLIC_URL=http://YOUR_SERVER_IP:8080
   ```

2. **Disable HTTPS**:
   ```env
   JITSI_DISABLE_HTTPS=1
   ```

⚠️ **Note**: IP-based access may have limitations with browser security policies.

## 🔍 Verification

### Check Room ID Generation

1. Create a booking in the app
2. Accept the booking (as teacher)
3. Check the booking object - should have:
   ```json
   {
     "meetingRoomId": "educonnect-advanced-math-507f1f77bcf86cd799439011-a3f5b2c1d4e6f7a8",
     "meetingLink": "https://meet.yourdomain.com/educonnect-advanced-math-507f1f77bcf86cd799439011-a3f5b2c1d4e6f7a8"
   }
   ```

### Test Jitsi Connection

1. **Check Jitsi Web**:
   ```bash
   curl http://localhost:8080
   ```

2. **Check JVB**:
   ```bash
   docker compose logs jitsi-jvb
   ```

3. **Test Meeting**:
   - Open `https://meet.yourdomain.com` (or `http://YOUR_IP:8080`)
   - Create a test room
   - Verify video/audio works

## 🐛 Troubleshooting

### Room IDs Not Generating

**Check:**
1. Backend logs: `docker compose logs backend`
2. Verify `JITSI_DOMAIN` is set in `backend/.env`
3. Check booking acceptance endpoint is working

### Jitsi Not Accessible

**Check:**
1. **Ports are open**:
   ```bash
   sudo ufw status
   sudo ufw allow 8080/tcp
   sudo ufw allow 10000/udp
   ```

2. **Jitsi services running**:
   ```bash
   docker compose ps | grep jitsi
   ```

3. **JVB logs**:
   ```bash
   docker compose logs jitsi-jvb
   ```

4. **DOCKER_HOST_ADDRESS set correctly**:
   ```bash
   # Get your server IP
   curl ifconfig.me
   # Update JITSI_DOCKER_HOST_ADDRESS in .env
   ```

### Video/Audio Not Working

**Check:**
1. Browser permissions (camera/microphone)
2. Browser console for errors (F12)
3. JVB logs for connection issues
4. Firewall allows UDP port 10000

### Room ID Collision (Should Not Happen)

The room ID includes:
- Unique booking ID (MongoDB ObjectId)
- Random 16-character hex string

**Probability of collision**: ~0 (negligible)

If you suspect collision:
1. Check database for duplicate `meetingRoomId`
2. Verify `generateMeetingRoomId` function is being called
3. Check for booking ID reuse (shouldn't happen)

## 📊 Monitoring

### Check Service Status

```bash
# All Jitsi services
docker compose ps | grep jitsi

# Specific service logs
docker compose logs -f jitsi-web
docker compose logs -f jitsi-jvb
docker compose logs -f jitsi-jicofo
docker compose logs -f jitsi-prosody
```

### Resource Usage

```bash
# Docker stats
docker stats educonnect-jitsi-jvb

# System resources
htop
```

### Room Statistics

Jitsi provides REST API for statistics:

```bash
curl http://localhost:8080/about/health
```

## 🔄 Updates

### Update Jitsi Images

```bash
docker compose pull jitsi-web jitsi-prosody jitsi-jicofo jitsi-jvb
docker compose up -d
```

### Backup Configuration

```bash
# Backup Jitsi config volumes
docker run --rm -v educonnect_jitsi-web-config:/data -v $(pwd):/backup \
  alpine tar czf /backup/jitsi-web-config-backup.tar.gz /data
```

## 📚 Additional Resources

- [Jitsi Official Documentation](https://jitsi.github.io/handbook/)
- [Jitsi Docker Repository](https://github.com/jitsi/docker-jitsi-meet)
- [DigitalOcean Deployment Guide](./DIGITALOCEAN_DEPLOYMENT.md)

## ✅ Summary

- ✅ **Self-hosted Jitsi** integrated into docker-compose
- ✅ **Unique room IDs** per class (booking)
- ✅ **Configurable domain** via environment variables
- ✅ **Production-ready** with security options
- ✅ **Easy deployment** on DigitalOcean or any VPS

Your EduConnect application now has full control over video conferencing! 🎉

