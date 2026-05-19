/**
 * formatExpenses.js
 *
 * Transforms raw Expense documents into display-ready objects for the frontend.
 *
 * Key design decisions
 * ────────────────────
 * • Settlement-type expenses get a distinct shape so the UI can render them
 *   in the dedicated "Settlements" tab without polluting the "Records" tab
 *   with noise entries.
 * • The `isSettlementRecord` flag lets GroupDetail.jsx split the expenses array
 *   into two distinct lists cheaply, without re-querying the server.
 * • `youOwe` / `othersOweYou` are always 0 for settlement records — they are
 *   completed payment records, not open debts.
 * • `settled` is always true for settlement records so they appear in the
 *   correct "settled" bucket if the UI ever needs it.
 */
export const formatExpenses = (expenses, userId) => {
  return expenses.map(exp => {
    const payerId        = (exp.paidby?._id || exp.paidby)?.toString();
    const isPayer        = payerId === userId.toString();
    const settledBy      = (exp.settledBy || []).map(id =>
      (id?._id || id).toString()
    );
    const hasUserSettled = settledBy.includes(userId.toString());

    // ── Settlement payment record ────────────────────────────────────────
    // These are created when a user clicks "Settle" in the Balances tab.
    // They should appear ONLY in the Settlements tab, not in Records tab.
    if (exp.splitType === 'settlement') {
      const receiver   = exp.splitamong?.[0];
      const receiverId = (receiver?._id || receiver)?.toString();
      const isReceiver = receiverId === userId.toString();

      return {
        _id:               exp._id,
        title:             exp.description || 'Settlement Payment',
        amount:            exp.amount,
        paidBy:            exp.paidby?.fullname || exp.paidby?.username || 'Unknown',
        payerId,
        group:             exp.group,
        splitType:         'settlement',
        isSettlementRecord: true,          // ← tells the UI to route this to the Settlements tab
        splitWith: [
          isReceiver
            ? 'You'
            : (receiver?.fullname || receiver?.username || 'Unknown'),
        ],
        status:       'SETTLED',
        youOwe:       0,
        othersOweYou: 0,
        settled:      true,
        settledAt:    exp.createdAt || new Date(),
        createdAt:    exp.createdAt,
      };
    }

    // ── Determine per-user share ─────────────────────────────────────────
    let share          = 0;
    let splitWithNames = [];

    if (exp.splitType === 'custom' && exp.customSplits?.length) {
      const myEntry = exp.customSplits.find(cs =>
        (cs.user?._id || cs.user)?.toString() === userId.toString()
      );
      share          = myEntry ? Number(myEntry.amount) : 0;
      splitWithNames = exp.customSplits.map(cs => {
        const uid = (cs.user?._id || cs.user)?.toString();
        return uid === userId.toString()
          ? 'You'
          : (cs.user?.fullname || cs.user?.username || '?');
      });
    } else {
      const splitCount = exp.splitamong?.length || 0;
      share            = splitCount > 0 ? exp.amount / splitCount : 0;
      splitWithNames   = (exp.splitamong || []).map(u =>
        (u._id || u).toString() === userId.toString()
          ? 'You'
          : (u.fullname || u.username || '?')
      );
    }

    // ── How much the payer is still owed by un-settled participants ──────
    let othersOweYou = 0;
    if (isPayer) {
      if (exp.splitType === 'custom' && exp.customSplits?.length) {
        exp.customSplits.forEach(cs => {
          const uid = (cs.user?._id || cs.user)?.toString();
          if (uid === payerId)           return; // skip payer's own slice
          if (settledBy.includes(uid))   return; // this person already settled
          othersOweYou += Number(cs.amount);
        });
      } else {
        const equalShare = (exp.splitamong?.length || 0) > 0
          ? exp.amount / exp.splitamong.length
          : 0;
        (exp.splitamong || []).forEach(u => {
          const uid = (u._id || u).toString();
          if (uid === payerId)           return;
          if (settledBy.includes(uid))   return;
          othersOweYou += equalShare;
        });
      }
    }

    const isSettledForUser = isPayer
      ? othersOweYou < 0.01
      : hasUserSettled;

    return {
      _id:               exp._id,
      title:             exp.description,
      amount:            exp.amount,
      paidBy:            exp.paidby?.fullname || exp.paidby?.username || 'Unknown',
      payerId,
      group:             exp.group,
      splitType:         exp.splitType || 'equal',
      isSettlementRecord: false,           // ← regular expense, belongs in Records tab
      splitWith:         splitWithNames,
      status:            isPayer
                           ? (othersOweYou < 0.01 ? 'SETTLED' : 'YOU PAID')
                           : (isSettledForUser ? 'SETTLED' : 'PENDING'),
      youOwe:            isPayer || isSettledForUser ? 0 : share,
      othersOweYou:      isPayer ? othersOweYou : 0,
      settledBy:         exp.settledBy,
      settled:           exp.settled || isSettledForUser,
      createdAt:         exp.createdAt,
    };
  });
};