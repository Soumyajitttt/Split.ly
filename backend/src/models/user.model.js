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
userSchema.methods.generateAccessToken = async function() {
    const user = this;
    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
}

userSchema.methods.isPasswordCorrect = async function(password) {
    const user = this;
    return await bcrypt.compare(password, user.password);
}

//hash password before saving user
userSchema.pre('save', async function(next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
});

export const User = mongoose.model('User', userSchema);
