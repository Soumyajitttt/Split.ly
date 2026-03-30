import { loginUser, registerUser, logoutUser } from "../controllers/user.controller.js";
import { Router } from "express";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout",authenticateUser, logoutUser);



export default router;
