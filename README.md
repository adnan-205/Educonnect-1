# EduConnect

> 🚀 **Ready for DigitalOcean Deployment!** See [QUICK_DEPLOY_DIGITALOCEAN.md](./QUICK_DEPLOY_DIGITALOCEAN.md) for simple deployment guide. - Online Learning Platform

A comprehensive MERN stack application connecting students and teachers for online learning sessions.

## 🚀 Features

### For Teachers
- **Gig Management**: Create, edit, and delete teaching gigs
- **Booking Management**: Accept or reject student booking requests
- **Dashboard Analytics**: View earnings, ratings, and booking statistics
- **Profile Management**: Professional LinkedIn-inspired profiles

### For Students
- **Browse Teachers**: Search and filter available gigs by category, price, and rating
- **Book Sessions**: Schedule sessions with preferred teachers
- **Class Management**: Track upcoming and completed classes
- **Dashboard**: View booking history and statistics

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **TypeScript** for type safety
- **JWT** authentication with **bcrypt**
- **Express Validator** for input validation
- **CORS**, **Helmet**, and **Rate Limiting** for security

### Frontend
- **Next.js 15** with **React 19**
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** with **shadcn/ui** components
- **NextAuth.js** for authentication
- **Axios** for API communication

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Start the frontend server:
```bash
npm run dev
```

## 🧪 Testing the Application

### 1. User Registration & Authentication
- Visit `http://localhost:3000`
- Register as both a teacher and student (use different emails)
- Test login/logout functionality

### 2. Teacher Workflow
1. **Login as Teacher**
2. **Navigate to Teacher Dashboard**
3. **Create a Gig**:
   - Title: "Advanced Mathematics Tutoring"
   - Category: "Math"
   - Price: "25"
   - Duration: "60"
   - Description: "Comprehensive math tutoring for high school students"
4. **Verify Gig Creation**: Check if gig appears in dashboard
5. **Test Gig Management**: Try editing/deleting gigs

### 3. Student Workflow
1. **Login as Student**
2. **Browse Available Gigs**: Visit browse page
3. **Search & Filter**: Test category filters and search functionality
4. **Book a Session**:
   - Select a gig and click "Book Now"
   - Choose preferred date and time
   - Submit booking request
5. **Check Dashboard**: Verify booking appears in student dashboard

### 4. Booking Management
1. **Teacher Side**: Check booking requests in teacher dashboard
2. **Accept/Reject**: Test booking approval workflow
3. **Student Side**: Verify booking status updates

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `PUT /api/auth/update-role` - Update user role

### Gigs
- `GET /api/gigs` - Get all gigs
- `POST /api/gigs` - Create new gig (Teacher only)
- `PUT /api/gigs/:id` - Update gig (Teacher only)
- `DELETE /api/gigs/:id` - Delete gig (Teacher only)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create booking (Student only)
- `PUT /api/bookings/:id` - Update booking status (Teacher only)

## 🎯 Key Features Implemented

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Teacher/Student)
- Protected routes and API endpoints

### Real-time Data Management
- Dynamic gig loading and filtering
- Real-time booking status updates
- Dashboard statistics and analytics

### Professional UI/UX
- Responsive design with Tailwind CSS
- Modern component library (Radix UI)
- Loading states and error handling
- Form validation and user feedback

### Database Integration
- MongoDB with Mongoose ODM
- Proper data relationships and validation
- Efficient querying and indexing

## 🚀 Deployment

### Backend Deployment
1. Build the TypeScript code:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

### Frontend Deployment
1. Build the Next.js application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify backend server is running on port 5000
   - Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
   - Ensure CORS is properly configured

2. **Authentication Issues**
   - Verify JWT_SECRET is set in backend
   - Check NEXTAUTH_SECRET in frontend
   - Clear browser localStorage and cookies

3. **Database Connection**
   - Verify MongoDB connection string
   - Check network access in MongoDB Atlas
   - Ensure database user has proper permissions

### Debug Mode
- Check browser console for API request/response logs
- Monitor backend server logs for errors
- Use network tab to inspect API calls

## 📈 Future Enhancements

- [ ] Real-time chat during sessions
- [ ] Video calling integration
- [ ] Payment processing
- [ ] Calendar synchronization
- [ ] Email notifications
- [ ] Review and rating system
- [ ] Advanced search filters
- [ ] Mobile app development

## 🔒 Future Scalability: Self-Hosted Jitsi Setup

Use this checklist when migrating from meet.jit.si to a self-hosted Jitsi with JWT and advanced moderation.

- [ ] Install Jitsi via Docker (jitsi/docker-jitsi-meet)
  - Configure `PUBLIC_URL`, TLS, and proper TURN/ICE (coturn) for NAT traversal
- [ ] Enable JWT auth (Prosody/luajwtjitsi)
  - Set `ENABLE_AUTH=1` and `AUTH_TYPE=jwt`
  - Issue JWTs in backend on authorized joins (claims: aud, iss, sub, room, context.user)
- [ ] Force lobby approval by default
  - Set lobby to on; only moderators (teachers) can admit participants
- [ ] Replace meet.jit.si with your domain
  - Frontend `NEXT_PUBLIC_JITSI_DOMAIN=<your.domain>`
  - Backend meeting links: `https://<your.domain>/<room>`
- [ ] Add analytics/observability
  - Enable callstats/jaas analytics or Grafana/Prometheus exporters
  - Track join/leave, packet loss, bitrate for QoS
- [ ] Security hardening
  - Disable invite/add-people UI
  - Enforce E2EE where possible; restrict non-authenticated rooms
  - Rate-limit room creation and joining


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
