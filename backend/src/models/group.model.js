import mongoose from "mongoose";
import { Schema } from "mongoose";

const groupSchema = new Schema({
    name: {
        type: String,   
        required: true
    },
    description: {
        type: String,
    },
    groupcode: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    expenses: [{
        type: Schema.Types.ObjectId,
        ref: 'Expense'
    }]
}, { timestamps: true });

export const Group = mongoose.model('Group', groupSchema);
