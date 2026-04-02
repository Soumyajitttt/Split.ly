import { Router } from "express";
import { createExpense } from "../controllers/expense.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:groupId/create-expense", authenticateUser, createExpense);

export default router;