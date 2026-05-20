import { Expense } from "../models/expense.model.js";
import { Group   } from "../models/group.model.js";
import { User    } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { formatExpenses  } from "../utils/formatExpenses.js";
import { settleBalances  } from "../utils/settleBalances.js";

/* ─────────────────────────────────────────────────────────────────────────────
 * createExpense
 * ───────────────────────────────────────────────────────────────────────── */
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
        amount:    Number(amount),
        paidby:    payerId,
        group:     group._id,
        splitType: splitType || 'equal',
    };

    let involvedUserIds = [];

    if (splitType === 'settlement') {
        if (!splitamong?.length) {
            return res.status(400).json({ message: "Settlement requires a recipient" });
        }
        const recipientId = splitamong[0].toString();
        if (!group.members.some(m => (m._id || m).toString() === recipientId)) {
            return res.status(400).json({ message: "Settlement recipient must be a group member" });
        }
        expenseData.settled    = true;
        expenseData.splitamong = splitamong;
        involvedUserIds        = [payerId.toString()];

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
        expenseData.splitamong   = customSplits.map(cs => cs.user);
        involvedUserIds          = customSplits.map(cs => cs.user.toString());

    } else {
        if (!splitamong?.length) {
            return res.status(400).json({ message: "Select who to split with" });
        }
        const allValid = splitamong.every(uid =>
            group.members.some(m => (m._id || m).toString() === uid.toString())
        );
        if (!allValid) return res.status(400).json({ message: "All split members must belong to the group" });
        expenseData.splitamong = splitamong;
        involvedUserIds        = splitamong.map(String);
    }

    const expense = new Expense(expenseData);
    await expense.save();

    await Group.findByIdAndUpdate(group._id, { $addToSet: { expenses: expense._id } });

    const allUsers = [...new Set([...involvedUserIds, payerId.toString()])];
    await User.updateMany({ _id: { $in: allUsers } }, { $addToSet: { expenses: expense._id } });

    res.status(201).json({ success: true, message: "Expense created successfully", expense });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * getExpensesForGroup
 * ───────────────────────────────────────────────────────────────────────── */
const getExpensesForGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId      = req.user._id;

    const group = await Group.findById(groupId).populate({
        path: "expenses",
        populate: [
            { path: "paidby",            select: "fullname username" },
            { path: "splitamong",        select: "fullname username" },
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

/* ─────────────────────────────────────────────────────────────────────────────
 * getExpensesForUser
 * ───────────────────────────────────────────────────────────────────────── */
const getExpensesForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const expenses = await Expense.find({
        $or: [{ paidby: userId }, { splitamong: userId }, { 'customSplits.user': userId }]
    })
    .populate("paidby",            "fullname username")
    .populate("splitamong",        "fullname username")
    .populate("customSplits.user", "fullname username")
    .populate("group",             "name")
    .sort({ createdAt: -1 });

    const formattedExpenses = formatExpenses(expenses, userId);
    res.status(200).json({ success: true, expenses: formattedExpenses });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * deleteExpense
 * ───────────────────────────────────────────────────────────────────────── */
const deleteExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) return res.status(404).json({ message: "Expense not found" });
    if (expense.paidby.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only the payer can delete this expense" });
    }

    await Expense.findByIdAndDelete(expenseId);
    await Group.findByIdAndUpdate(expense.group, { $pull: { expenses: expense._id } });

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

/* ─────────────────────────────────────────────────────────────────────────────
 * settleExpense  (legacy per-expense settle — kept for backwards compat)
 * ───────────────────────────────────────────────────────────────────────── */
const settleExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const { userId    } = req.body;

    if (!expenseId || !userId) {
        return res.status(400).json({ message: "Missing expenseId or userId" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
    }

    await Expense.findByIdAndUpdate(expenseId, { $addToSet: { settledBy: userId } });

    const updated = await Expense.findById(expenseId);
    res.json({ success: true, message: "Expense settled", expense: updated });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * initiateSettlement  — Feature 3 (step 1 of 2)
 *
 * Called by the DEBTOR when they click "Settle" on a balance row.
 * Records a pending settlement on the Group document.
 * The creditor must then confirm via confirmSettlement.
 *
 * POST /expenses/:groupId/initiate-settlement
 * Body: { fromId, toId, amount }
 * ───────────────────────────────────────────────────────────────────────── */
const initiateSettlement = asyncHandler(async (req, res) => {
    const { groupId }          = req.params;
    const { fromId, toId, amount } = req.body;
    const requesterId          = req.user._id.toString();

    if (!fromId || !toId || !amount) {
        return res.status(400).json({ message: "fromId, toId, and amount are required" });
    }
    if (fromId.toString() !== requesterId) {
        return res.status(403).json({ message: "Only the debtor can initiate a settlement" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some(m => (m._id || m).toString() === requesterId);
    if (!isMember) return res.status(403).json({ message: "Not a group member" });

    // Prevent duplicate pending settlements between the same pair
    const alreadyPending = group.pendingSettlements?.some(
        ps => ps.fromId.toString() === fromId.toString()
           && ps.toId.toString()   === toId.toString()
    );
    if (alreadyPending) {
        return res.status(400).json({ message: "A settlement is already pending between these two members" });
    }

    group.pendingSettlements = group.pendingSettlements || [];
    group.pendingSettlements.push({ fromId, toId, amount: Number(amount) });
    await group.save();

    res.status(201).json({
        success: true,
        message: "Settlement initiated — waiting for the other party to confirm",
        pendingSettlements: group.pendingSettlements
    });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * confirmSettlement  — Feature 3 (step 2 of 2)
 *
 * Called by the CREDITOR when they click "Confirm" on the pending settlement.
 * Removes the pending record and creates the real settlement expense document.
 *
 * POST /expenses/:groupId/confirm-settlement
 * Body: { pendingId }   ← the _id of the pendingSettlement subdocument
 * ───────────────────────────────────────────────────────────────────────── */
const confirmSettlement = asyncHandler(async (req, res) => {
    const { groupId }   = req.params;
    const { pendingId } = req.body;
    const requesterId   = req.user._id.toString();

    if (!pendingId) {
        return res.status(400).json({ message: "pendingId is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const pending = group.pendingSettlements?.id(pendingId);
    if (!pending) {
        return res.status(404).json({ message: "Pending settlement not found" });
    }

    // Only the intended creditor (toId) may confirm
    if (pending.toId.toString() !== requesterId) {
        return res.status(403).json({ message: "Only the payment recipient can confirm this settlement" });
    }

    const { fromId, toId, amount } = pending;

    // Remove the pending record first (before creating the expense, so a
    // double-confirm is impossible even if two requests race)
    group.pendingSettlements.pull(pendingId);
    await group.save();

    // Create the real settlement expense — identical to what handleSettleDebt
    // used to POST directly, but now gated behind the two-party confirmation
    const expenseData = {
        description: `Settlement: ${fromId} to ${toId}`,   // will be enriched on read via population
        amount:      Number(amount),
        paidby:      fromId,
        group:       group._id,
        splitType:   'settlement',
        splitamong:  [toId],
        settled:     true,
    };

    const expense = new Expense(expenseData);
    await expense.save();

    await Group.findByIdAndUpdate(group._id, { $addToSet: { expenses: expense._id } });

    // Only attach to the payer's expense list (recipient sees it via the group)
    await User.findByIdAndUpdate(fromId, { $addToSet: { expenses: expense._id } });

    // Enrich description with real names before responding
    await expense.populate([
        { path: "paidby",     select: "fullname username" },
        { path: "splitamong", select: "fullname username" }
    ]);

    const payerName  = expense.paidby?.fullname   || expense.paidby?.username   || 'Unknown';
    const payeeName  = expense.splitamong?.[0]?.fullname || expense.splitamong?.[0]?.username || 'Unknown';
    expense.description = `Settlement: ${payerName} to ${payeeName}`;
    await expense.save();

    res.status(201).json({
        success: true,
        message: "Settlement confirmed and recorded",
        expense
    });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * cancelSettlement
 *
 * Called by EITHER party to cancel a pending (unconfirmed) settlement.
 * Both the debtor and creditor should be able to withdraw.
 *
 * DELETE /expenses/:groupId/cancel-settlement
 * Body: { pendingId }
 * ───────────────────────────────────────────────────────────────────────── */
const cancelSettlement = asyncHandler(async (req, res) => {
    const { groupId }   = req.params;
    const { pendingId } = req.body;
    const requesterId   = req.user._id.toString();

    if (!pendingId) {
        return res.status(400).json({ message: "pendingId is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const pending = group.pendingSettlements?.id(pendingId);
    if (!pending) {
        return res.status(404).json({ message: "Pending settlement not found" });
    }

    // Either party may cancel
    const isParty = pending.fromId.toString() === requesterId
                 || pending.toId.toString()   === requesterId;
    if (!isParty) {
        return res.status(403).json({ message: "Only the debtor or creditor can cancel this settlement" });
    }

    group.pendingSettlements.pull(pendingId);
    await group.save();

    res.status(200).json({ success: true, message: "Settlement cancelled" });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * getGroupSummary
 * ───────────────────────────────────────────────────────────────────────── */
const getGroupSummary = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("members", "fullname username")
        .populate({
            path: "expenses",
            populate: [
                { path: "paidby",            select: "fullname username" },
                { path: "splitamong",        select: "fullname username" },
                { path: "customSplits.user", select: "fullname username" }
            ]
        });

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some(m => (m._id || m).toString() === req.user._id.toString())) {
        return res.status(403).json({ message: "Not authorized" });
    }

    const totalExpense = group.expenses
        .filter(exp => exp.splitType !== 'settlement')
        .reduce((sum, exp) => sum + exp.amount, 0);

    const { settlements } = settleBalances(group.expenses, group.members);

    const enrichedSettlements = settlements.map(s => {
        const fromMember = group.members.find(m => m._id.toString() === s.from);
        const toMember   = group.members.find(m => m._id.toString() === s.to);
        return {
            fromId: s.from,
            toId:   s.to,
            from:   fromMember?.fullname || fromMember?.username,
            to:     toMember?.fullname   || toMember?.username,
            amount: s.amount
        };
    });

    // Enrich pending settlements with member names for the frontend
    const enrichedPending = (group.pendingSettlements || []).map(ps => {
        const fromMember = group.members.find(m => m._id.toString() === ps.fromId.toString());
        const toMember   = group.members.find(m => m._id.toString() === ps.toId.toString());
        return {
            _id:    ps._id,
            fromId: ps.fromId.toString(),
            toId:   ps.toId.toString(),
            from:   fromMember?.fullname || fromMember?.username || 'Unknown',
            to:     toMember?.fullname   || toMember?.username   || 'Unknown',
            amount: ps.amount,
            initiatedAt: ps.initiatedAt
        };
    });

    res.status(200).json({
        success: true,
        group: { name: group.name, members: group.members },
        totalExpense,
        settlements:        enrichedSettlements,
        pendingSettlements: enrichedPending
    });
});

export {
    createExpense,
    getExpensesForGroup,
    getExpensesForUser,
    deleteExpense,
    settleExpense,
    initiateSettlement,
    confirmSettlement,
    cancelSettlement,
    getGroupSummary
};