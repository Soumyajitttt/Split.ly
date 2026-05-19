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
  // 'equal' = divide evenly, 'custom' = per-person amounts in customSplits
  splitType: {
    type: String,
    enum: ['equal', 'custom', 'settlement'],
    default: 'equal'
  },
  // For equal splits — list of user ids sharing the cost
  splitamong: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For custom splits — [{ user: ObjectId, amount: Number }]
  customSplits: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  // Tracks who has paid their share of this specific expense
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