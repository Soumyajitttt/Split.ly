import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

// Hash password before saving user
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password for login
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


// Method to generate JWT access token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Method to generate JWT refresh token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model('User', userSchema);
