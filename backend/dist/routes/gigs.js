"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gigs_1 = require("../controllers/gigs");
const auth_1 = require("../middleware/auth");
const reviews_1 = require("../controllers/reviews");
const router = express_1.default.Router();
router
    .route('/')
    .get(gigs_1.getGigs)
    .post(auth_1.protect, (0, auth_1.authorize)('teacher'), gigs_1.createGig);
router
    .route('/:id')
    .get(gigs_1.getGig)
    .put(auth_1.protect, (0, auth_1.authorize)('teacher'), gigs_1.updateGig)
    .delete(auth_1.protect, (0, auth_1.authorize)('teacher'), gigs_1.deleteGig);
// Nested review routes for a gig
router.get('/:gigId/reviews', reviews_1.getGigReviews);
router.get('/:gigId/reviews/me', auth_1.protect, reviews_1.getMyReviewForGig);
router.post('/:gigId/reviews', auth_1.protect, (0, auth_1.authorize)('student'), reviews_1.createReview);
exports.default = router;
