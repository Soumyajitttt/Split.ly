import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password } = req.body;

    //check for all fields
    if (!fullname || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }  
    
    //check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
    }  
    
    //create new user
    const user = new User({ fullname, email, password });
    await user.save(); // save user to database
    res.status(201).json({ success: true, message: "User registered successfully", user });
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    //check for all fields   
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    //check if user exists
    const registeredUser = await User.findOne({ email });
    if (!registeredUser) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    //check if password is correct
    const isPasswordCorrect = await registeredUser.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    //generate access token
    const accessToken = await registeredUser.generateAccessToken();

    //remove password from response
    registeredUser.password = undefined;

    res.status(200).json({ success: true, message: "User logged in successfully", user: registeredUser, accessToken });
});





export { registerUser, loginUser };
