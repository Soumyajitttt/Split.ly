import {Group} from "../models/group.model.js";
import {User} from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";


// const generateUniqueGroupCode = async () => {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let groupCode;
//     let isUnique = false;
//     while (!isUnique) {
//         groupCode = '';
//         for (let i = 0; i < 6; i++) {
//             groupCode += characters.charAt(Math.floor(Math.random() * characters.length));
//         }
//         const existingGroup = await Group.findOne({ groupcode: groupCode });
//         if (!existingGroup) {
//             isUnique = true;
//         }
//     }
//     return groupCode;
// };

// Improved version with limited attempts to prevent infinite loop 
const generateUniqueGroupCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;

    while (attempts < 5) {
        let groupCode = '';

        for (let i = 0; i < 6; i++) {
            groupCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const existingGroup = await Group.findOne({ groupcode: groupCode });

        if (!existingGroup) {
            return groupCode;
        }

        attempts++;
    }

    throw new Error("Failed to generate unique group code");
};

const createGroup = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: "Group name is required" });
    }

    const groupcode = await generateUniqueGroupCode();

    // Create group with only the creator as member
    const group = new Group({ 
        name, 
        description, 
        groupcode,
        members: [req.user._id],
        createdBy: req.user._id
    });
    await group.save();

    // Push group into creator's groups array
    await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { groups: group._id } }
    );
    
    // Populate the group with member and creator details before sending response
    await group.populate([
        { path: "members", select: "fullname username email" },
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

    // Check if user is already a member
    // if (group.members.includes(req.user._id)) {
    //     return res.status(400).json({ success: false, message: "You are already a member of this group" });
    // }
    
    // Check if already a member
    const isMember = group.members.some(
        member => member.toString() === req.user._id.toString()
    );

    if (isMember) {
        return res.status(400).json({ success: false, message: "You are already a member of this group" });
    }

    // Add user to group members
    group.members.push(req.user._id);
    await group.save();

    // Push group into user's groups array
    await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { groups: group._id } }
    );

    await group.populate([
        { path: "members", select: "fullname username email" },
        { path: "createdBy", select: "fullname username" }
    ]);

    return res.status(200).json({ 
        success: true, 
        message: "Successfully joined the group", 
        group
    });
});

const getMyGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({
        members: req.user._id
    })
    .sort({ createdAt: -1 })
    .populate("members", "fullname username email")
    .populate("createdBy", "fullname username");

    return res.status(200).json({
        success: true,
        groups
    });
});

const getAllGroups = asyncHandler(async (req, res) => { 
    const groups = await Group.find().sort({ createdAt: -1 }) 
    .populate("members", "fullname username email") 
    .populate("createdBy", "fullname username"); 
    return res.status(200).json({ success: true, groups }); 
});//not used currently, but can be used in future to show all groups in the app

const leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({
            success: false,
            message: "Group ID is required"
        });
    }

    const group = await Group.findById(groupId);

    if (!group) {
        return res.status(404).json({
            success: false,
            message: "Group not found"
        });
    }

    //check if user is the creator of the group
    if (group.createdBy.toString() === req.user._id.toString()) {
        return res.status(400).json({
            success: false,
            message: "Group creators cannot leave the group."
        });
    }

    const initialLength = group.members.length;

    // Remove user from group members
    group.members = group.members.filter(
        member => member.toString() !== req.user._id.toString()
    );

    // Check if user was actually a member and removed from the group
    if (group.members.length === initialLength) {
        return res.status(400).json({
            success: false,
            message: "You are not a member of this group"
        });
    }

    // If no members left, delete the group. Otherwise, save the updated group.
    if (group.members.length === 0) {
        await Group.findByIdAndDelete(groupId);
    } else {
        await group.save();
    }

    // Remove the group from the user's groups array
    await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { groups: group._id } }
    );

    return res.status(200).json({
        success: true,
        message: "Successfully left the group"
    });
});

const getGroupDetails = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({
            success: false,
            message: "Group ID is required"
        });
    }    

    const group = await Group.findById(groupId)
        .populate("members", "fullname username email")
        .populate("createdBy", "fullname username");
    if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" });
    }
    return res.status(200).json({ success: true, group });
});//not used currently, but can be used in future to show group details when user clicks on a group in the UI

    
export { createGroup, joinGroup, getMyGroups, leaveGroup, getGroupDetails, getAllGroups};