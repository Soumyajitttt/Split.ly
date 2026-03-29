import {User} from "../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";

const authenticateUser = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
});

export default authenticateUser;

