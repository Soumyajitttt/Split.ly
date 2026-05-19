import { Router } from 'express';
import {
    createExpense,
    getExpensesForGroup,
    getExpensesForUser,
    deleteExpense,
    settleExpense,
    getGroupSummary
} from '../controllers/expense.controller.js';
import authenticateUser from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/:groupId/create-expense', createExpense);
router.get('/:groupId/expenses', getExpensesForGroup);
router.get('/my-expenses', getExpensesForUser);
router.get('/:groupId/summary', getGroupSummary);
router.delete('/:expenseId', deleteExpense);
router.patch('/:expenseId/settle', settleExpense);   // NEW

export default router;
