import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { formatExpenses } from "../utils/formatExpenses.js";
import { settleBalances } from "../utils/settleBalances.js";

//testing not done yet
const createExpense = asyncHandler(async (req, res) => {
    const { description, amount, splitamong } = req.body;
    const paidby = req.user._id;
    const { groupId } = req.params;

    // Validate input
    if (!description || !amount || !splitamong?.length) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    // Validate amount
    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        });
    }

    const group = await Group.findById(groupId);

    // Check if group exists
    if (!group) {
        return res.status(404).json({ message: "Group not found" });
    }

    // Check payer
    if (!group.members.some(member => member.toString() === paidby.toString())) {
        return res.status(400).json({
            message: "You must be a member of the group"
        });
    }

    // Check split members
    const allMembersValid = splitamong.every(userId =>
        group.members.some(member => member.toString() === userId.toString())
    );

    if (!allMembersValid) {
        return res.status(400).json({
            message: "All split members must belong to the group"
        });
    }

    const expense = new Expense({
        description,
        amount,
        paidby,
        splitamong,
        group: group._id
    });

    await expense.save();

    // Add expense reference to group 
    await Group.findByIdAndUpdate(group._id, {
        $addToSet: { expenses: expense._id }
    });

    // Add expense reference to each user 
    const allUsers = [...new Set([...splitamong, paidby.toString()])];

    await User.updateMany(
        { _id: { $in: allUsers } },
        { $addToSet: { expenses: expense._id } }
    );

    res.status(201).json({
        success: true,
        message: "Expense created successfully",
        expense
    });
});

const getExpensesForGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId).populate({
        path: "expenses",
        populate: [
            { path: "paidby", select: "fullname" },
            { path: "splitamong", select: "fullname" }
        ]
    });

    if (!group) {
        return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member.toString() === userId.toString())) {
        return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Transform data for UI
    const formattedExpenses = formatExpenses(group.expenses, userId);

    res.status(200).json({
        success: true,
        expenses: formattedExpenses
    });
});

const getExpensesForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all expenses where user is either the payer or a split member
    const expenses = await Expense.find({
        $or: [
            { paidby: userId },
            { splitamong: userId }
        ]
    })
    .populate("paidby", "fullname")
    .populate("splitamong", "fullname")
    .populate("group", "name")
    .sort({ createdAt: -1 });

    // Transform data for UI
    const formattedExpenses = formatExpenses(expenses, userId);

    res.status(200).json({
        success: true,
        expenses: formattedExpenses
    });
});

const deleteExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    // Check if expense exists
    if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
    }

    // Only the user who created the expense can delete it
    if (expense.paidby.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not allowed" });
    }

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    // Remove expense reference from group and users
    await Group.findByIdAndUpdate(expense.group, {
        $pull: { expenses: expense._id }
    });

    const allUsers = [...new Set([
        ...expense.splitamong.map(id => id.toString()),
        expense.paidby.toString()
    ])];

    await User.updateMany(
        { _id: { $in: allUsers } },
        { $pull: { expenses: expense._id } }
    );

    res.status(200).json({
        success: true,
        message: "Expense deleted successfully"
    });
});

const getGroupSummary = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId)
        .populate("members", "fullname")
        .populate({
            path: "expenses",
            populate: [
                { path: "paidby" },
                { path: "splitamong" }
            ]
        })

    // Check if group exists
    if (!group) {
        return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: "Not authorized" });
    }


    // Calculate total expenses and settlements
    const totalExpense = group.expenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
    );

    // Calculate settlements using the settleBalances utility function
    const { settlements } = settleBalances(group.expenses, group.members);

    res.status(200).json({
        success: true,
        group: {
            name: group.name,
            members: group.members
        },
        totalExpense,
        settlements
    });
});


export { createExpense, getExpensesForGroup, getExpensesForUser, deleteExpense, getGroupSummary };