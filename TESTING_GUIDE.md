# EduConnect Testing Guide

## 🧪 Complete Testing Workflow

### Step 1: Server Setup Verification

1. **Backend Server Status**
   - Should be running on `http://localhost:5000`
   - Check console for "Server running on port 5000"
   - Test API health: `GET http://localhost:5000/api/gigs`

2. **Frontend Server Status**
   - Should be running on `http://localhost:3000`
   - Next.js compilation should be successful
   - No TypeScript errors in console

### Step 2: Authentication Flow Testing

#### Register New Users
1. **Teacher Account**
   ```
   Name: John Smith
   Email: teacher@educonnect.com
   Password: password123
   Role: Teacher
   ```

2. **Student Account**
   ```
   Name: Jane Doe
   Email: student@educonnect.com
   Password: password123
   Role: Student
   ```

#### Login Testing
- Test login with both accounts
- Verify role-based dashboard redirection
- Check JWT token storage in localStorage

### Step 3: Teacher Functionality Testing

#### Gig Creation
1. **Navigate to Teacher Dashboard**
2. **Click "Create New Gig"**
3. **Fill Form with Test Data**:
   ```
   Title: Advanced JavaScript Programming
   Category: Programming
   Price: 35
   Duration: 90
   Description: Learn modern JavaScript, ES6+, async/await, and frameworks
   ```
4. **Submit and Verify**:
   - Success message appears
   - Gig shows in dashboard
   - Form resets after submission

#### Gig Management
- **Edit Gig**: Modify price or description
- **Delete Gig**: Remove a test gig
- **View Statistics**: Check dashboard metrics

#### Booking Request Management
- **Accept Booking**: Approve student requests
- **Reject Booking**: Decline with reason
- **View Details**: Check booking information

### Step 4: Student Functionality Testing

#### Browse Gigs
1. **Navigate to Browse Page**
2. **Test Search**: Search for "JavaScript"
3. **Test Filters**:
   - Category: Programming
   - Price Range: $30-$40
4. **Verify Results**: Check filtered gigs display

#### Booking Process
1. **Select a Gig**: Click "Book Now"
2. **Fill Booking Form**:
   ```
   Preferred Date: Tomorrow's date
   Preferred Time: 14:00
   ```
3. **Submit Request**
4. **Check Student Dashboard**: Verify booking appears

#### Dashboard Verification
- **Upcoming Classes**: Check pending bookings
- **Class History**: View completed sessions
- **Statistics**: Verify booking counts

### Step 5: End-to-End Flow Testing

#### Complete Booking Cycle
1. **Teacher**: Create gig
2. **Student**: Browse and book gig
3. **Teacher**: Accept booking request
4. **Student**: Verify accepted status
5. **Both**: Check dashboard updates

#### Data Persistence Testing
- Refresh browser pages
- Logout and login again
- Verify data remains consistent

### Step 6: Error Handling Testing

#### Network Errors
- Stop backend server
- Try creating gig (should show error)
- Restart server and retry

#### Validation Errors
- Submit empty forms
- Invalid email formats
- Weak passwords
- Missing required fields

#### Authentication Errors
- Access protected routes without login
- Expired token handling
- Role-based access restrictions

### Step 7: UI/UX Testing

#### Responsive Design
- Test on different screen sizes
- Mobile navigation functionality
- Touch interactions

#### Loading States
- Form submission loading
- Data fetching spinners
- Skeleton loading for lists

#### User Feedback
- Success/error alerts
- Form validation messages
- Empty state displays

## 🔍 Debug Checklist

### Backend Issues
- [ ] MongoDB connection established
- [ ] Environment variables loaded
- [ ] CORS configuration correct
- [ ] JWT secret configured
- [ ] API routes responding

### Frontend Issues
- [ ] API URL configured correctly
- [ ] NextAuth setup complete
- [ ] Token interceptor working
- [ ] Component state management
- [ ] Route protection active

### Common Error Solutions

#### "Network Error" in Console
```javascript
// Check API base URL in services/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

#### "Unauthorized" Errors
```javascript
// Verify token in localStorage
console.log(localStorage.getItem('token'));
```

#### Database Connection Issues
```javascript
// Check MongoDB URI in backend .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educonnect
```

## 📊 Performance Testing

### Load Testing
- Create multiple gigs simultaneously
- Test concurrent booking requests
- Monitor response times

### Data Volume Testing
- Create 50+ gigs
- Test search performance
- Verify pagination (if implemented)

## ✅ Testing Completion Checklist

- [ ] User registration works for both roles
- [ ] Login/logout functionality
- [ ] Teacher can create/edit/delete gigs
- [ ] Student can browse and filter gigs
- [ ] Booking creation and management
- [ ] Dashboard statistics update
- [ ] Error handling works properly
- [ ] Responsive design functions
- [ ] Data persists across sessions
- [ ] API endpoints respond correctly

## 🚀 Next Steps After Testing

1. **Production Deployment**
   - Environment configuration
   - Database migration
   - SSL certificate setup

2. **Feature Enhancements**
   - Real-time notifications
   - Payment integration
   - Video calling
   - Review system

3. **Performance Optimization**
   - API response caching
   - Image optimization
   - Bundle size reduction
   - Database indexing
