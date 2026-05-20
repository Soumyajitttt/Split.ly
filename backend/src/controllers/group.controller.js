import { Group   } from "../models/group.model.js";
import { User    } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateUniqueGroupCode } from "../utils/generateCode.js";
import { settleBalances } from "../utils/settleBalances.js";

const createGroup = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: "Group name is required" });
    }

    const groupcode = await generateUniqueGroupCode();

    const group = new Group({ 
        name, 
        description, 
        groupcode,
        members: [req.user._id],
        createdBy: req.user._id
    });
    await group.save();

    await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { groups: group._id } }
    );
    
    await group.populate([
        { path: "members",   select: "fullname username email" },
        { path: "createdBy", select: "fullname username" }
    ]);

    return res.status(201).json({ 
        success: true, 
        message: "Group created successfully", 
        group
    });
});

const joinGroup = asyncHandler(async (req, res) => {
    const { groupcode } = req.body;

    const group = await Group.findOne({ groupcode });
    if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" });
    }
    
    const isMember = group.members.some(
        member => (member._id || member).toString() === req.user._id.toString()
    );
    if (isMember) {
        return res.status(400).json({ success: false, message: "You are already a member of this group" });
    }

    group.members.push(req.user._id);
    await group.save();

    await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { groups: group._id } }
    );

    await group.populate([
        { path: "members",   select: "fullname username email" },
        { path: "createdBy", select: "fullname username" }
    ]);

    return res.status(200).json({ 
        success: true, 
        message: "Successfully joined the group", 
        group
    });
});

const getMyGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({ members: req.user._id })
        .sort({ createdAt: -1 })
        .populate("members",   "fullname username email")
        .populate("createdBy", "fullname username");

    return res.status(200).json({ success: true, groups });
});

const getAllGroups = asyncHandler(async (req, res) => { 
    const groups = await Group.find()
        .sort({ createdAt: -1 })
        .populate("members",   "fullname username email")
        .populate("createdBy", "fullname username");
    return res.status(200).json({ success: true, groups });
});

const leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId      = req.user._id;

    if (!groupId) {
        return res.status(400).json({ success: false, message: "Group ID is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" });
    }

    const isCreator = group.createdBy.toString() === userId.toString();
    const isSoleMember = group.members.length === 1 &&
        (group.members[0]._id || group.members[0]).toString() === userId.toString();

    // ── Feature 1: Admin can leave only if they are the last member. ─────────
    // In that case the group is deleted. Otherwise the admin is blocked — they
    // must transfer ownership (future feature) before leaving.
    if (isCreator && !isSoleMember) {
        return res.status(400).json({
            success: false,
            message: "You are the group admin. You can only leave once all other members have left."
        });
    }

    // Verify user is actually a member
    const isMember = group.members.some(
        m => (m._id || m).toString() === userId.toString()
    );
    if (!isMember) {
        return res.status(400).json({ success: false, message: "You are not a member of this group" });
    }

    // ── Feature 2: Block leave if user has any unsettled net balance. ────────
    //
    // We use the same settleBalances function the Balances tab uses — so the
    // check is guaranteed to match exactly what the UI shows.  If the tab says
    // "All settled!" for this user, this check passes too.
    const uid = userId.toString();

    const fullGroup = await Group.findById(groupId)
        .populate("members", "_id")
        .populate({
            path: "expenses",
            populate: [
                { path: "paidby",            select: "_id" },
                { path: "splitamong",        select: "_id" },
                { path: "customSplits.user", select: "_id" }
            ]
        });

    const { settlements: openSettlements } = settleBalances(
        fullGroup.expenses,
        fullGroup.members
    );

    // The user is "involved in an unsettled balance" if they appear in any
    // remaining transfer the algorithm still requires.
    const hasUnsettledDebt = openSettlements.some(
        s => s.from === uid || s.to === uid
    );

    if (hasUnsettledDebt) {
        return res.status(400).json({
            success: false,
            message: "You have unsettled expenses in this group. Please settle all balances before leaving."
        });
    }

    // ── Proceed with leave ───────────────────────────────────────────────────
    if (isSoleMember) {
        // Last member (admin or not) → delete the whole group
        await Group.findByIdAndDelete(groupId);
    } else {
        group.members = group.members.filter(
            m => (m._id || m).toString() !== uid
        );
        await group.save();
    }

    await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });

    return res.status(200).json({
        success: true,
        message: isSoleMember
            ? "Group deleted as you were the last member."
            : "Successfully left the group"
    });
});

const getGroupDetails = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({ success: false, message: "Group ID is required" });
    }    

    const group = await Group.findById(groupId)
        .populate("members",   "fullname username email")
        .populate("createdBy", "fullname username");
    if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" });
    }
    return res.status(200).json({ success: true, group });
});

export { createGroup, joinGroup, getMyGroups, leaveGroup, getGroupDetails, getAllGroups };