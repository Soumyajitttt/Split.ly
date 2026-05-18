import { User } from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// Called after successful Google OAuth — redirect to frontend with token
const googleCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user; // set by passport
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    // Redirect to frontend with accessToken in query (frontend stores it)
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userPayload = encodeURIComponent(JSON.stringify({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      username: user.username,
    }));

    return res
      .cookie('refreshToken', refreshToken, options)
      .redirect(`${frontendURL}/auth/callback?token=${accessToken}&user=${userPayload}`);
  } catch (err) {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendURL}/login?error=google_auth_failed`);
  }
});

export { googleCallback };
