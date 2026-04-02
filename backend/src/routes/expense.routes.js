import { Router } from "express";
import { createExpense, getExpensesForGroup } from "../controllers/expense.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:groupId/create-expense", authenticateUser, createExpense);
router.get("/:groupId/expenses", authenticateUser, getExpensesForGroup);

export default router;