import { Router } from "express";
import { createGroup, joinGroup, getMyGroups, leaveGroup } from "../controllers/group.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-group", authenticateUser, createGroup);
router.post("/join-group", authenticateUser, joinGroup);
router.get("/my-groups", authenticateUser, getMyGroups);
router.post("/leave-group", authenticateUser, leaveGroup);

export default router;