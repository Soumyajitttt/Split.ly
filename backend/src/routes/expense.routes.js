import { Router } from "express";
import { createExpense, getExpensesForGroup, getExpensesForUser, getGroupSummary, deleteExpense, getOverallSummary } from "../controllers/expense.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:groupId/create-expense", authenticateUser, createExpense);
router.get("/:groupId/expenses", authenticateUser, getExpensesForGroup);
router.get("/my-expenses", authenticateUser, getExpensesForUser);
router.get("/:groupId/summary", authenticateUser, getGroupSummary);
router.delete("/:expenseId", authenticateUser, deleteExpense);
router.get("/summary", authenticateUser, getOverallSummary);

export default router;