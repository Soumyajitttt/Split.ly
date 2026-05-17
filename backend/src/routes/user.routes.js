import { loginUser, registerUser, logoutUser, refreshAccessToken, getCurrentUser } from "../controllers/user.controller.js";
import { Router } from "express";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout",authenticateUser, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", authenticateUser, getCurrentUser);


export default router;
