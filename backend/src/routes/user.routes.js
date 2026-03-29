import { loginUser, registerUser } from "../controllers/user.controller.js";
import { Router } from "express";

const router = Router();

//task routes
router.post("/register", registerUser);
router.post("/login", loginUser);



export default router;
