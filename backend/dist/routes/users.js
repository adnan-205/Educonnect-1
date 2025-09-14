"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = require("../controllers/users");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes for viewing user profile and gigs
router.get('/:id', users_1.getUser);
router.get('/:id/gigs', users_1.getUserGigs);
// Protected
router.put('/me', auth_1.protect, users_1.updateMe);
exports.default = router;
