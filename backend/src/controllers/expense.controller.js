import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";


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
    const group = await Group.findById(groupId).populate({
        path: "expenses",
        populate: {
            path: "paidby",
            select: "name email"
        }
    });

    if (!group) {
        return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({
        success: true,
        expenses: group.expenses
    });
});


export { createExpense, getExpensesForGroup };