import {User} from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { parseDurationMs } from "../utils/parseDuration.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Error generating tokens: " + error.message);
    }
};

// Cookie options — sameSite: "none" is required because frontend (Vercel)
// and backend (Render) are on different domains (cross-origin).
// sameSite: "strict" silently blocks the cookie in this setup.
//
// maxAge is REQUIRED here: without it, this becomes a browser *session*
// cookie, which mobile browsers in particular drop the moment the app is
// backgrounded for a while (OS reclaiming memory, the browser process
// restarting, etc.) — regardless of how long REFRESH_TOKEN_EXPIRY actually
// is. That was silently logging people out after leaving the site unused,
// even though their refresh token itself was still perfectly valid.
const REFRESH_COOKIE_MAX_AGE = parseDurationMs(process.env.REFRESH_TOKEN_EXPIRY, 7 * 24 * 60 * 60 * 1000);

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: REFRESH_COOKIE_MAX_AGE,
};

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, password } = req.body;
    let { email, username } = req.body;

    if (!fullname || !email || !password || !username) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }  

    email = email.toLowerCase().trim();
    username = username.toLowerCase().trim();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
    } 
    
    const existingUsername = await User.findOne({username});
    if(existingUsername) {
        return res.status(400).json({ success: false, message: "Username not available, try another one" });
    } 
    
    const user = new User({ fullname, email, username, password });
    await user.save();
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        return res.status(500).json({ success: false, message: "Something went wrong while registering the user" });
    }

    return res.status(201).json({ success: true, message: "User registered successfully", user: createdUser });
});


const loginUser = asyncHandler(async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    email = email.toLowerCase().trim();

    const registeredUser = await User.findOne({ email });
    if (!registeredUser) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await registeredUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(registeredUser._id);

    const user = await User.findById(registeredUser._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json({ success: true, message: "User logged in successfully", user, accessToken });
});


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    return res
        .status(200)
        .clearCookie("refreshToken", cookieOptions)
        .json({ success: true, message: "User logged out successfully" });
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json({ success: false, message: "Refresh token not found" });
    }

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded._id);

    // user.refreshToken is only used as a "signed in" marker here: login sets it,
    // logout unsets it (revoking the session). We deliberately do NOT require the
    // incoming token to equal the stored one. Strict single-use rotation made any
    // two overlapping refreshes (several requests firing at once after the app sat
    // idle, two tabs, a phone + laptop) invalidate each other, and the loser got a
    // 401 -> forced logout. A validly signed, unexpired token is enough.
    if (!user || !user.refreshToken) {
        return res.status(401).json({ success: false, message: "Session is no longer valid" });
    }

    const accessToken = user.generateAccessToken();
    // Fresh refresh token on every refresh => sliding session: it only expires
    // after REFRESH_TOKEN_EXPIRY of *inactivity*, not N days after first login.
    const newRefreshToken = user.generateRefreshToken();

    return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json({
            success: true,
            message: "Access token refreshed successfully",
            data: { accessToken, refreshToken: newRefreshToken }
        });
});


// Health checks
const healthCheck = (req, res) => res.status(200).json({ status: 'ok' });
const healthAuthCheck = (req, res) => res.status(200).json({ success: true });

export { registerUser, loginUser, logoutUser, refreshAccessToken, healthCheck, healthAuthCheck };