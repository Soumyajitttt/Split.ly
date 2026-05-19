import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { formatExpenses } from "../utils/formatExpenses.js";
import { settleBalances } from "../utils/settleBalances.js";

const createExpense = asyncHandler(async (req, res) => {
    const { description, amount, paidby, splitamong, splitType, customSplits } = req.body;
    const { groupId } = req.params;

    const payerId = paidby || req.user._id;

    if (!description || !amount) {
        return res.status(400).json({ message: "Description and amount are required" });
    }
    if (Number(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some(m => (m._id || m).toString() === req.user._id.toString())) {
        return res.status(403).json({ message: "You must be a member of the group" });
    }

    if (!group.members.some(m => (m._id || m).toString() === payerId.toString())) {
        return res.status(400).json({ message: "Payer must be a group member" });
    }

    let expenseData = {
        description,
        amount: Number(amount),
        paidby: payerId,
        group: group._id,
        splitType: splitType || 'equal',
    };

    let involvedUserIds = [];

    // BUG FIX: Settlement must have its own dedicated branch.
    // The original code set expenseData.splitamong = [] and then fell into the
    // equal-split else-branch which immediately overwrote splitamong with req.body.splitamong
    // and ran irrelevant equal-split validation. Settlement also must never be validated
    // the same way as a regular expense.
    if (splitType === 'settlement') {
        if (!splitamong?.length) {
            return res.status(400).json({ message: "Settlement requires a recipient" });
        }
        // Validate that the recipient is a group member
        const recipientId = splitamong[0].toString();
        if (!group.members.some(m => (m._id || m).toString() === recipientId)) {
            return res.status(400).json({ message: "Settlement recipient must be a group member" });
        }
        // Mark as settled immediately — a settlement expense is a completed payment record
        expenseData.settled = true;
        // Store the creditor in splitamong so settleBalances can identify the recipient
        expenseData.splitamong = splitamong;
        // Only the payer needs this in their expense history; the recipient sees it via the group
        involvedUserIds = [payerId.toString()];

    } else if (splitType === 'custom' && customSplits?.length) {
        const customTotal = customSplits.reduce((s, cs) => s + Number(cs.amount), 0);
        if (Math.abs(customTotal - Number(amount)) > 0.01) {
            return res.status(400).json({
                message: `Custom split amounts (₹${customTotal.toFixed(2)}) must add up to the total (₹${Number(amount).toFixed(2)})`
            });
        }
        const allValid = customSplits.every(cs =>
            group.members.some(m => (m._id || m).toString() === cs.user.toString())
        );
        if (!allValid) return res.status(400).json({ message: "All split members must belong to the group" });

        expenseData.customSplits = customSplits.map(cs => ({ user: cs.user, amount: Number(cs.amount) }));
        expenseData.splitamong = customSplits.map(cs => cs.user);
        involvedUserIds = customSplits.map(cs => cs.user.toString());

    } else {
        if (!splitamong?.length) {
            return res.status(400).json({ message: "Select who to split with" });
        }
        const allValid = splitamong.every(uid =>
            group.members.some(m => (m._id || m).toString() === uid.toString())
        );
        if (!allValid) return res.status(400).json({ message: "All split members must belong to the group" });
        expenseData.splitamong = splitamong;
        involvedUserIds = splitamong.map(String);
    }

    const expense = new Expense(expenseData);
    await expense.save();

    await Group.findByIdAndUpdate(group._id, { $addToSet: { expenses: expense._id } });

    const allUsers = [...new Set([...involvedUserIds, payerId.toString()])];
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
            { path: "splitamong", select: "fullname username" },
            { path: "customSplits.user", select: "fullname username" }
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
        $or: [{ paidby: userId }, { splitamong: userId }, { 'customSplits.user': userId }]
    })
    .populate("paidby", "fullname username")
    .populate("splitamong", "fullname username")
    .populate("customSplits.user", "fullname username")
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

    // Collect users from both splitamong AND customSplits so every participant's
    // expense reference is cleaned up, not just equal-split members
    const splitAmongIds  = expense.splitamong.map(String);
    const customSplitIds = (expense.customSplits || []).map(cs =>
        (cs.user?._id || cs.user).toString()
    );
    const allUsers = [...new Set([
        ...splitAmongIds,
        ...customSplitIds,
        expense.paidby.toString()
    ])];

    await User.updateMany({ _id: { $in: allUsers } }, { $pull: { expenses: expense._id } });

    res.status(200).json({ success: true, message: "Expense deleted successfully" });
});

const settleExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const { userId } = req.body;

    if (!expenseId || !userId) {
        return res.status(400).json({ message: "Missing expenseId or userId" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
    }

    await Expense.findByIdAndUpdate(expenseId, {
        $addToSet: { settledBy: userId }
    });

    const updated = await Expense.findById(expenseId);
    res.json({ success: true, message: "Expense settled", expense: updated });
});

const getGroupSummary = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("members", "fullname username")
        .populate({
            path: "expenses",
            populate: [
                { path: "paidby", select: "fullname username" },
                { path: "splitamong", select: "fullname username" },
                { path: "customSplits.user", select: "fullname username" }
            ]
        });

    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some(m => (m._id || m).toString() === req.user._id.toString())) {
        return res.status(403).json({ message: "Not authorized" });
    }

    // Total expense should only count real expenses, not settlement payment records
    const totalExpense = group.expenses
        .filter(exp => exp.splitType !== 'settlement')
        .reduce((sum, exp) => sum + exp.amount, 0);

    // BUG FIX: Pass ALL expenses (including settlement-type) to settleBalances.
    // The original code filtered out settlement expenses before this call, meaning
    // settlements never reduced the debts they were supposed to cancel.
    // settleBalances now handles settlement-type expenses internally to reduce debts.
    const { settlements } = settleBalances(group.expenses, group.members);

    const enrichedSettlements = settlements.map(s => {
        const fromMember = group.members.find(m => m._id.toString() === s.from);
        const toMember   = group.members.find(m => m._id.toString() === s.to);

        return {
            // BUG FIX: removed expenseId field — settleBalances returns computed net
            // settlements, not references to specific expense documents, so expenseId
            // was always undefined here.
            fromId: s.from,
            toId:   s.to,
            from:   fromMember?.fullname || fromMember?.username,
            to:     toMember?.fullname   || toMember?.username,
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