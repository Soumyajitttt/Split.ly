import { Router } from 'express';
import {
    createExpense,
    getExpensesForGroup,
    getExpensesForUser,
    deleteExpense,
    settleExpense,
    getGroupSummary,
    initiateSettlement, // NEW
    confirmSettlement,  // NEW
    cancelSettlement    // NEW
} from '../controllers/expense.controller.js';
import authenticateUser from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/:groupId/create-expense', createExpense);
router.get('/:groupId/expenses', getExpensesForGroup);
router.get('/my-expenses', getExpensesForUser);
router.get('/:groupId/summary', getGroupSummary);
router.delete('/:expenseId', deleteExpense);
router.patch('/:expenseId/settle', settleExpense);

// --- NEW SETTLEMENT ROUTES ---
router.post('/:groupId/initiate-settlement', initiateSettlement);
router.post('/:groupId/confirm-settlement', confirmSettlement);
router.delete('/:groupId/cancel-settlement', cancelSettlement);

export default router;