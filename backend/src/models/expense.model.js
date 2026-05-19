import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const expenseSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidby: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  splitamong: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // NEW: Tracks exactly who has paid their share of this specific expense
  settledBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  settled: {
    type: Boolean,
    default: false
  },
  settledAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export const Expense = mongoose.model('Expense', expenseSchema);