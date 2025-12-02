"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/register', auth_1.register);
router.post('/login', auth_1.login);
router.put('/update-role', auth_2.protect, (0, auth_2.authorize)('admin'), auth_1.updateRole);
// Allow role selection without authentication (used during onboarding)
// Only allows 'student' or 'teacher' roles, not 'admin'
router.put('/update-my-role', auth_1.updateMyRole);
router.post('/clerk-sync', auth_1.clerkSync);
exports.default = router;
