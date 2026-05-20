import { Expense } from "../models/expense.model.js";
import { Group   } from "../models/group.model.js";
import { User    } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { formatExpenses } from "../utils/formatExpenses.js";
import { settleBalances } from "../utils/settleBalances.js";
import { sendEmail, emailTemplates } from "../utils/emailService.js";

/* ─────────────────────────────────────────────────────────────────────────────
 * createExpense
 * Emails every split participant (except the payer) notifying them of their share.
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
    // Tracks { userId → shareAmount } for email personalisation
    let shareMap = {};

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
        customSplits.forEach(cs => { shareMap[cs.user.toString()] = Number(cs.amount); });

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
        const equalShare = Number(amount) / splitamong.length;
        splitamong.forEach(uid => { shareMap[uid.toString()] = equalShare; });
    }

    const expense = new Expense(expenseData);
    await expense.save();

    await Group.findByIdAndUpdate(group._id, { $addToSet: { expenses: expense._id } });

    const allUsers = [...new Set([...involvedUserIds, payerId.toString()])];
    await User.updateMany({ _id: { $in: allUsers } }, { $addToSet: { expenses: expense._id } });

    // ── Fire-and-forget emails to all non-payer participants ─────────────
    if (splitType !== 'settlement') {
        const payer = await User.findById(payerId).select('fullname username');
        const payerName = payer?.fullname || payer?.username || 'Someone';

        const participantIds = Object.keys(shareMap).filter(id => id !== payerId.toString());
        if (participantIds.length > 0) {
            const participants = await User.find({ _id: { $in: participantIds } })
                .select('fullname username email');
            participants.forEach(participant => {
                if (!participant.email) return;
                sendEmail(emailTemplates.expenseAdded({
                    toEmail:     participant.email,
                    toName:      participant.fullname || participant.username,
                    payerName,
                    description,
                    totalAmount: Number(amount),
                    yourShare:   shareMap[participant._id.toString()] || 0,
                    groupName:   group.name,
                    groupId,
                    splitType:   splitType || 'equal',
                }));
            });
        }
    }

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
 * Emails every affected participant that their balance has been updated.
 * ───────────────────────────────────────────────────────────────────────── */
const deleteExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId)
        .populate("paidby",            "fullname username email")
        .populate("splitamong",        "fullname username email")
        .populate("customSplits.user", "fullname username email")
        .populate("group",             "name _id");

    if (!expense) return res.status(404).json({ message: "Expense not found" });
    if ((expense.paidby._id || expense.paidby).toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only the payer can delete this expense" });
    }

    // Capture everything needed for emails BEFORE deleting
    const payerName   = expense.paidby?.fullname || expense.paidby?.username || 'Someone';
    const description = expense.description;
    const totalAmount = expense.amount;
    const groupName   = expense.group?.name || 'your group';
    const groupId     = expense.group?._id?.toString() || expense.group?.toString();
    const isCustom    = expense.splitType === 'custom' && expense.customSplits?.length;
    const payerId     = (expense.paidby._id || expense.paidby).toString();

    // Build { userId → { user, share } } map
    const affectedMap = {};
    if (isCustom) {
        expense.customSplits.forEach(cs => {
            const uid = (cs.user?._id || cs.user).toString();
            affectedMap[uid] = { user: cs.user, share: cs.amount };
        });
    } else {
        const equalShare = (expense.splitamong?.length || 0) > 0
            ? expense.amount / expense.splitamong.length : 0;
        (expense.splitamong || []).forEach(u => {
            const uid = (u._id || u).toString();
            affectedMap[uid] = { user: u, share: equalShare };
        });
    }

    await Expense.findByIdAndDelete(expenseId);
    await Group.findByIdAndUpdate(expense.group, { $pull: { expenses: expense._id } });

    const splitAmongIds  = expense.splitamong.map(u => (u._id || u).toString());
    const customSplitIds = (expense.customSplits || []).map(cs =>
        (cs.user?._id || cs.user).toString()
    );
    const allUsers = [...new Set([...splitAmongIds, ...customSplitIds, payerId])];
    await User.updateMany({ _id: { $in: allUsers } }, { $pull: { expenses: expense._id } });

    // ── Fire-and-forget deletion emails ──────────────────────────────────
    if (expense.splitType !== 'settlement') {
        Object.entries(affectedMap).forEach(([uid, { user, share }]) => {
            if (uid === payerId) return;
            if (!user?.email) return;
            sendEmail(emailTemplates.expenseDeleted({
                toEmail:    user.email,
                toName:     user.fullname || user.username || 'there',
                payerName,
                description,
                totalAmount,
                yourShare:  share,
                groupName,
                groupId,
            }));
        });
    }

    res.status(200).json({ success: true, message: "Expense deleted successfully" });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * settleExpense  (legacy per-expense settle)
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
 * initiateSettlement  — step 1 of 2
 * Emails the CREDITOR: "X wants to settle ₹Y with you — confirm in the app."
 * ───────────────────────────────────────────────────────────────────────── */
const initiateSettlement = asyncHandler(async (req, res) => {
    const { groupId }              = req.params;
    const { fromId, toId, amount } = req.body;
    const requesterId              = req.user._id.toString();

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

    // ── Email the creditor ────────────────────────────────────────────────
    const [debtor, creditor] = await Promise.all([
        User.findById(fromId).select('fullname username'),
        User.findById(toId).select('fullname username email'),
    ]);

    if (creditor?.email) {
        sendEmail(emailTemplates.settlementRequested({
            toEmail:   creditor.email,
            toName:    creditor.fullname  || creditor.username,
            fromName:  debtor?.fullname   || debtor?.username || 'Someone',
            amount:    Number(amount),
            groupName: group.name,
            groupId,
        }));
    }

    res.status(201).json({
        success: true,
        message: "Settlement initiated — waiting for the other party to confirm",
        pendingSettlements: group.pendingSettlements
    });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * confirmSettlement  — step 2 of 2
 * Emails the DEBTOR: "Your payment was confirmed — balance cleared."
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

    if (pending.toId.toString() !== requesterId) {
        return res.status(403).json({ message: "Only the payment recipient can confirm this settlement" });
    }

    const { fromId, toId, amount } = pending;

    group.pendingSettlements.pull(pendingId);
    await group.save();

    const expenseData = {
        description: `Settlement: ${fromId} to ${toId}`,
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
    await User.findByIdAndUpdate(fromId, { $addToSet: { expenses: expense._id } });

    await expense.populate([
        { path: "paidby",     select: "fullname username email" },
        { path: "splitamong", select: "fullname username email" }
    ]);

    const payerName = expense.paidby?.fullname  || expense.paidby?.username  || 'Unknown';
    const payeeName = expense.splitamong?.[0]?.fullname || expense.splitamong?.[0]?.username || 'Unknown';
    expense.description = `Settlement: ${payerName} to ${payeeName}`;
    await expense.save();

    // ── Email the debtor that their payment was confirmed ─────────────────
    if (expense.paidby?.email) {
        sendEmail(emailTemplates.settlementConfirmed({
            toEmail:         expense.paidby.email,
            toName:          payerName,
            confirmedByName: payeeName,
            amount:          Number(amount),
            groupName:       group.name,
            groupId,
        }));
    }

    res.status(201).json({
        success: true,
        message: "Settlement confirmed and recorded",
        expense
    });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * cancelSettlement
 * Emails the OTHER party that the settlement was cancelled.
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

    const isParty = pending.fromId.toString() === requesterId
                 || pending.toId.toString()   === requesterId;
    if (!isParty) {
        return res.status(403).json({ message: "Only the debtor or creditor can cancel this settlement" });
    }

    const { fromId, toId, amount } = pending;

    group.pendingSettlements.pull(pendingId);
    await group.save();

    // ── Email the OTHER party ─────────────────────────────────────────────
    const isCancellerDebtor = requesterId === fromId.toString();
    const otherPartyId      = isCancellerDebtor ? toId : fromId;

    const [canceller, otherParty] = await Promise.all([
        User.findById(requesterId).select('fullname username'),
        User.findById(otherPartyId).select('fullname username email'),
    ]);

    if (otherParty?.email) {
        sendEmail(emailTemplates.settlementCancelled({
            toEmail:         otherParty.email,
            toName:          otherParty.fullname || otherParty.username,
            cancelledByName: canceller?.fullname || canceller?.username || 'Someone',
            amount:          Number(amount),
            groupName:       group.name,
            groupId,
        }));
    }

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

    const enrichedPending = (group.pendingSettlements || []).map(ps => {
        const fromMember = group.members.find(m => m._id.toString() === ps.fromId.toString());
        const toMember   = group.members.find(m => m._id.toString() === ps.toId.toString());
        return {
            _id:         ps._id,
            fromId:      ps.fromId.toString(),
            toId:        ps.toId.toString(),
            from:        fromMember?.fullname || fromMember?.username || 'Unknown',
            to:          toMember?.fullname   || toMember?.username   || 'Unknown',
            amount:      ps.amount,
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