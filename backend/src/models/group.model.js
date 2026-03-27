import mongoose from "mongoose";
import { Schema } from "mongoose";

const groupSchema = new Schema({
    name: {
        type: String,   
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
