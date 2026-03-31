import {User} from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


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

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, password } = req.body;
    let { email, username } = req.body;

    //check for all fields
    if (!fullname || !email || !password || !username) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }  

    email = email.toLowerCase().trim();
    username = username.toLowerCase().trim();
    
    //check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
    } 
    
    //check if username already exists
    const existingUsername = await User.findOne({username});
    if(existingUsername) {
        return res.status(400).json({ success: false, message: "User Nmae not available, try another one" });
    } 
    
    //create new user
    const user = new User({ fullname, email,username, password });
    await user.save(); // save user to database
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        return res.status(500).json({ success: false, message: "Something went wrong while registering the user" } )
    }

    return res.status(201).json({ success: true, message: "User registered successfully", user: createdUser });
});


const loginUser = asyncHandler(async (req, res) => {
    let { email, password } = req.body;

    //check for all fields   
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    email = email.toLowerCase().trim();

    //check if user already registered
    const registeredUser = await User.findOne({ email });
    if (!registeredUser) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    //check if password is correct
    const isPasswordValid = await registeredUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    //generate access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(registeredUser._id)


    //remove password from response
    //registeredUser.password = undefined;
    const user = await User.findById(registeredUser._id).select("-password -refreshToken");

    //res.status(200).json({ success: true, message: "User logged in successfully", user, accessToken, refreshToken });
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .json({ success: true, message: "User logged in successfully", user, accessToken });
});

//task
const logoutUser = asyncHandler(async (req, res) => {
    //remove refresh token from database
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .json({
            success: true,
            message: "User logged out successfully"
        });
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    // Check if token exists
    if (!incomingRefreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token not found"
        });
    }

    // Verify token
    let decoded;
    try {
        decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }

    // Find user
    const user = await User.findById(decoded._id);

    // Validate token with DB
    if (!user || incomingRefreshToken !== user.refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token is invalid or already used"
        });
    }

    // Generate new tokens 
    const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    // Save new refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({
            success: true,
            message: "Access token refreshed successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
});


export { registerUser, loginUser, logoutUser, refreshAccessToken };
