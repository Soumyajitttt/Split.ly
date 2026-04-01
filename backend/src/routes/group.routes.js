import { Router } from "express";
import { createGroup, joinGroup } from "../controllers/group.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-group", authenticateUser, createGroup);
router.post("/join-group", authenticateUser, joinGroup);

export default router;