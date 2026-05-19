import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { formatExpenses } from "../utils/formatExpenses.js";
import { settleBalances } from "../utils/settleBalances.js";

const createExpense = asyncHandler(async (req, res) => {
    const { description, amount, paidby, splitamong } = req.body;
    const { groupId } = req.params;

    // paidby can be provided in body (for "someone else paid") or default to current user
    const payerId = paidby || req.user._id;

    if (!description || !amount || !splitamong?.length) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (Number(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Requester must be a member
    if (!group.members.some(m => (m._id || m).toString() === req.user._id.toString())) {
        return res.status(403).json({ message: "You must be a member of the group" });
    }

    // Payer must be a member
    if (!group.members.some(m => (m._id || m).toString() === payerId.toString())) {
        return res.status(400).json({ message: "Payer must be a group member" });
    }

    // All split members must be in the group
    const allValid = splitamong.every(uid =>
        group.members.some(m => (m._id || m).toString() === uid.toString())
    );
    if (!allValid) return res.status(400).json({ message: "All split members must belong to the group" });

    const expense = new Expense({
        description,
        amount: Number(amount),
        paidby: payerId,
        splitamong,
        group: group._id
    });

    await expense.save();

    await Group.findByIdAndUpdate(group._id, { $addToSet: { expenses: expense._id } });

    const allUsers = [...new Set([...splitamong.map(String), payerId.toString()])];
    await User.updateMany({ _id: { $in: allUsers } }, { $addToSet: { expenses: expense._id } });

    res.status(201).json({ success: true, message: "Expense created successfully", expense });
});

const getExpensesForGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).populate({
        path: "expenses",
        populate: [
            { path: "paidby", select: "fullname username" },
            { path: "splitamong", select: "fullname username" }
        ]
    });

    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some(m => (m._id || m).toString() === userId.toString())) {
        return res.status(403).json({ message: "You are not a member of this group" });
    }

    const formattedExpenses = formatExpenses(group.expenses, userId);

    res.status(200).json({ success: true, expenses: formattedExpenses });
});

const getExpensesForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const expenses = await Expense.find({
        $or: [{ paidby: userId }, { splitamong: userId }]
    })
    .populate("paidby", "fullname username")
    .populate("splitamong", "fullname username")
    .populate("group", "name")
    .sort({ createdAt: -1 });

    const formattedExpenses = formatExpenses(expenses, userId);

    res.status(200).json({ success: true, expenses: formattedExpenses });
});

const deleteExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (expense.paidby.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only the payer can delete this expense" });
    }

    await Expense.findByIdAndDelete(expenseId);
    await Group.findByIdAndUpdate(expense.group, { $pull: { expenses: expense._id } });

    const allUsers = [...new Set([...expense.splitamong.map(String), expense.paidby.toString()])];
    await User.updateMany({ _id: { $in: allUsers } }, { $pull: { expenses: expense._id } });

    res.status(200).json({ success: true, message: "Expense deleted successfully" });
});

// Mark an expense as settled (soft-settle — keeps history)
const settleExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    
    // We expect the frontend to tell us WHO is settling. 
    // If they don't, we assume the logged-in user is settling their own debt.
    const debtorId = req.body.debtorId || req.user._id.toString();

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const payerId = expense.paidby.toString();

    // Add the debtor to the settledBy array
    if (!expense.settledBy.includes(debtorId)) {
        expense.settledBy.push(debtorId);
    }

    // Check if everyone (except the payer) has settled
    const unsettledMembers = expense.splitamong.filter(id =>
        id.toString() !== payerId && !expense.settledBy.includes(id.toString())
    );

    // If everyone paid, mark the whole document as settled!
    if (unsettledMembers.length === 0) {
        expense.settled = true;
        expense.settledAt = new Date();
    }

    await expense.save();
    res.status(200).json({ success: true, message: "Expense share marked as settled" });
});
const getGroupSummary = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("members", "fullname username")
        .populate({
            path: "expenses",
            populate: [
                { path: "paidby", select: "fullname username" },
                { path: "splitamong", select: "fullname username" }
            ]
        });

    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some(m => (m._id || m).toString() === req.user._id.toString())) {
        return res.status(403).json({ message: "Not authorized" });
    }

    const totalExpense = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const { settlements } = settleBalances(group.expenses, group.members);

    // Enrich settlements with member names
    const enrichedSettlements = settlements.map(s => {
        const fromMember = group.members.find(m => m._id.toString() === s.from);
        const toMember   = group.members.find(m => m._id.toString() === s.to);
        return {
            fromId: s.from,
            toId:   s.to,
            from:   fromMember?.fullname || fromMember?.username || s.from,
            to:     toMember?.fullname   || toMember?.username   || s.to,
            amount: s.amount
        };
    });

    res.status(200).json({
        success: true,
        group: { name: group.name, members: group.members },
        totalExpense,
        settlements: enrichedSettlements
    });
});

export { createExpense, getExpensesForGroup, getExpensesForUser, deleteExpense, settleExpense, getGroupSummary };
