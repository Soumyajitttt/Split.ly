import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {    
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    groups: [{
        type: Schema.Types.ObjectId,
        ref: 'Group'
    }],
    expenses: [{
        type: Schema.Types.ObjectId,
        ref: 'Expense'
    }]
}, { timestamps: true });

//task - add method to generate access token and method to compare password

export const User = mongoose.model('User', userSchema);
