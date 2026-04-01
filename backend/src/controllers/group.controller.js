import {Group} from "../models/group.model.js";
import {User} from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";


const generateUniqueGroupCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let groupCode;
    let isUnique = false;
    while (!isUnique) {
        groupCode = '';
        for (let i = 0; i < 6; i++) {
            groupCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const existingGroup = await Group.findOne({ groupcode: groupCode });
        if (!existingGroup) {
            isUnique = true;
        }
    }
    return groupCode;
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
        { $push: { groups: group._id } }
    );
    
    // Populate the group with member and creator details before sending response
    const populatedGroup = await Group.findById(group._id)
        .populate("members", "fullname username email")
        .populate("createdBy", "fullname username");

    return res.status(201).json({ 
        success: true, 
        message: "Group created successfully", 
        group: populatedGroup 
    });
});


export { createGroup };