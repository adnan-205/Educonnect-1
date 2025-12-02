"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookings_1 = require("../controllers/bookings");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_1.protect);
router
    .route('/')
    .get(bookings_1.getBookings)
    .post((0, auth_1.authorize)('student'), validation_1.validateBookingCreation, bookings_1.createBooking);
// Access a meeting by room id (student or teacher only)
router.get('/room/:roomId', bookings_1.getBookingByRoom);
router
    .route('/:id')
    .get(bookings_1.getBooking)
    .put((0, auth_1.authorize)('teacher'), bookings_1.updateBookingStatus);
// Student marks attendance for a booking they own
router.post('/:id/attendance', bookings_1.markAttendance);
exports.default = router;
