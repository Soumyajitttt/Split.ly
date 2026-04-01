import { Router } from "express";
import { createGroup } from "../controllers/group.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-group", authenticateUser, createGroup);

export default router;