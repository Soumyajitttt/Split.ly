import { loginUser, registerUser, logoutUser, refreshAccessToken, healthCheck, healthAuthCheck } from '../controllers/user.controller.js';
import { googleCallback } from '../controllers/googleAuth.controller.js';
import { Router } from 'express';
import authenticateUser from '../middlewares/auth.middleware.js';
import passport from '../config/passport.js';

const router = Router();

// ── Health checks ─────────────────────────────────────────────────────────────
// Public ping — used by frontend keep-alive to prevent Render from sleeping
router.get('/health', healthCheck);

// Authenticated ping — used by AuthContext on app load to verify token validity
router.get('/health-auth', authenticateUser, healthAuthCheck);

// ── Standard auth ─────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authenticateUser, logoutUser);
router.post('/refresh-token', refreshAccessToken);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleCallback
);

export default router;