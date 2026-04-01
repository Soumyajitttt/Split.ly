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


export { createGroup, joinGroup };