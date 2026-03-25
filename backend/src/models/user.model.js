import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true, 
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    groups: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    expenses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense'
    }]

},
{
    timestamps: true
})

const User = mongoose.model('User', userSchema);

export default User;