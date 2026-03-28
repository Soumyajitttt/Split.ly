import mongoose from 'mongoose';
import {Schema} from 'mongoose';

const expenseSchema = new Schema({
    description: {
        type: String,   
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paidBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    splitAmong: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
}, { timestamps: true });

export const Expense = mongoose.model('Expense', expenseSchema);