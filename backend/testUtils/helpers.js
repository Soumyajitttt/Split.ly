// Small builders so tests read like the scenarios they describe.
// Shapes match what settleBalances / formatExpenses read from Expense documents.

/** Equal split: `payer` paid `amount`, shared by everyone in `among`. */
export const equal = (payer, amount, among, extra = {}) => ({
  paidby: payer,
  amount,
  splitType: 'equal',
  splitamong: among,
  settledBy: [],
  ...extra,
});

/** Custom split: `splits` is { userId: amount, ... }. */
export const custom = (payer, splits, extra = {}) => ({
  paidby: payer,
  amount: Object.values(splits).reduce((a, b) => a + b, 0),
  splitType: 'custom',
  customSplits: Object.entries(splits).map(([user, amount]) => ({ user, amount })),
  settledBy: [],
  ...extra,
});

/** Settlement record: `from` (debtor) paid `to` (creditor) `amount`. */
export const settlement = (from, to, amount) => ({
  paidby: from,
  amount,
  splitType: 'settlement',
  splitamong: [to],
});

/** Sum of signed money flow per person implied by a settlements array. */
export const netFlow = (settlements) => {
  const flow = {};
  for (const { from, to, amount } of settlements) {
    flow[from] = (flow[from] || 0) - amount;
    flow[to] = (flow[to] || 0) + amount;
  }
  return flow;
};

export const round2 = (n) => Math.round(n * 100) / 100;
