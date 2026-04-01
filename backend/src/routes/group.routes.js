import { Router } from "express";
import { createGroup, joinGroup, getAllGroups, leaveGroup } from "../controllers/group.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-group", authenticateUser, createGroup);
router.post("/join-group", authenticateUser, joinGroup);
router.get("/all-groups", authenticateUser, getAllGroups);
router.post("/leave-group", authenticateUser, leaveGroup);

export default router;