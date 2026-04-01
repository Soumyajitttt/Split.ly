import { Router } from "express";
import { createGroup, joinGroup, getMyGroups, leaveGroup, getGroupDetails } from "../controllers/group.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-group", authenticateUser, createGroup);
router.post("/join-group", authenticateUser, joinGroup);
router.get("/my-groups", authenticateUser, getMyGroups);
router.post("/:groupId/leave", authenticateUser, leaveGroup);
router.get("/:groupId", authenticateUser, getGroupDetails);

export default router;