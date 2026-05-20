import mongoose from "mongoose";
import { Schema } from "mongoose";

// Tracks a settlement that the debtor has initiated but the creditor has not
// yet confirmed. Once the creditor confirms, this entry is removed and a real
// settlement expense document is created.
const pendingSettlementSchema = new Schema({
    fromId: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // debtor (initiator)
    toId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },  // creditor (must confirm)
    amount: { type: Number, required: true },
    initiatedAt: { type: Date, default: Date.now }
}, { _id: true });

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
    }],
    // Two-party settlement handshake: debtor initiates → stored here → creditor confirms → cleared
    pendingSettlements: [pendingSettlementSchema]
}, { timestamps: true });

export const Group = mongoose.model('Group', groupSchema);