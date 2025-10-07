"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gigs_1 = require("../controllers/gigs");
const auth_1 = require("../middleware/auth");
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
exports.default = router;
