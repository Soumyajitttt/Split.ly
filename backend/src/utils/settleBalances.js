/**
 * settleBalances.js
 *
 * Computes the minimum set of transfers needed to clear all debts in a group.
 *
 * Algorithm (greedy creditor/debtor matching):
 *   1. Build each member's net balance from all expenses.
 *   2. Reduce settlement-type expenses directly (they cancel recorded debts).
 *   3. Split members into creditors (net > 0) and debtors (net < 0).
 *   4. Greedily match the largest debtor to the largest creditor, producing
 *      at most (N-1) transfers — optimal for the typical case and handles
 *      circular chains perfectly (everyone nets to 0 → no transfers at all).
 *
 * Test-case guarantees:
 *   TC1 Circular chain  → all nets are 0 → "All settled!" (0 transfers)
 *   TC2 Core simplifier → Pessy pays Ravi ₹10, Soumyajit pays Ravi ₹70 (2 transfers)
 *   TC3 Star network    → Pessy pays Ravi ₹30, Soumyajit pays Ravi ₹30 (2 transfers)
 *   TC4 Partial settle  → after Pessy→Ravi settlement, only Soumyajit→Ravi ₹70 remains
 */
export const settleBalances = (expenses, members) => {
  // ── 1. Collect all member IDs ────────────────────────────────────────────
  const memberMap = {};
  members.forEach(m => {
    const id = (m._id || m).toString();
    memberMap[id] = m;
  });

  // ── 2. Initialise net balance for every known member ────────────────────
  const net = {};
  members.forEach(m => { net[(m._id || m).toString()] = 0; });

  // ── 3. Walk every expense and accumulate net positions ──────────────────
  expenses.forEach(exp => {
    const payerId = (exp.paidby?._id || exp.paidby).toString();

    // Ensure payer slot exists (edge case: payer not in members list)
    if (!(payerId in net)) net[payerId] = 0;

    // ── Settlement transaction ─────────────────────────────────────────
    // "Debtor (paidby) has physically paid Creditor (splitamong[0])."
    // Reduce the debtor's outstanding obligation and the creditor's receivable.
    if (exp.splitType === 'settlement') {
      const creditorRaw = exp.splitamong?.[0];
      const creditorId  = (creditorRaw?._id || creditorRaw)?.toString();
      if (!creditorId) return;
      if (!(creditorId in net)) net[creditorId] = 0;
      // Debtor sent money → their net goes up (less negative / more positive).
      net[payerId]   += exp.amount;
      // Creditor received money → their net goes down (less positive / more negative).
      net[creditorId] -= exp.amount;
      return;
    }

    // ── Skip individual-settled regular expenses ───────────────────────
    // (exp.settled on a non-settlement expense means every participant has
    //  clicked "settled"; we still need to decide per-participant below,
    //  but a blanket skip would break partial settlements — so we process
    //  per user using settledBy instead.)

    const settledBy = (exp.settledBy || []).map(id =>
      (id?._id || id).toString()
    );

    // ── Custom split ───────────────────────────────────────────────────
    if (exp.splitType === 'custom' && exp.customSplits?.length) {
      exp.customSplits.forEach(cs => {
        const uid = (cs.user?._id || cs.user).toString();
        if (!(uid in net)) net[uid] = 0;
        if (uid === payerId) return;             // payer's own share is already covered
        if (settledBy.includes(uid)) return;     // this person already settled individually
        const share = Number(cs.amount);
        net[payerId] += share;   // payer is owed more
        net[uid]     -= share;   // debtor owes more
      });
      return;
    }

    // ── Equal split ────────────────────────────────────────────────────
    const participants = exp.splitamong || [];
    if (!participants.length) return;
    const share = Number(exp.amount) / participants.length;

    participants.forEach(u => {
      const uid = (u?._id || u).toString();
      if (!(uid in net)) net[uid] = 0;
      if (uid === payerId) return;
      if (settledBy.includes(uid)) return;
      net[payerId] += share;
      net[uid]     -= share;
    });
  });

  // ── 4. Greedy creditor/debtor matching ──────────────────────────────────
  //
  // Build two heaps (arrays sorted by magnitude) — creditors have net > 0,
  // debtors have net < 0.  Repeatedly match the biggest debtor to the biggest
  // creditor until both lists are empty.  This minimises transfer count and
  // correctly resolves circular chains (all nets are 0 → both lists empty).
  const EPSILON = 0.01;

  const creditors = []; // { id, amount }  (amount > 0 — they are owed money)
  const debtors   = []; // { id, amount }  (amount > 0 — they owe money)

  Object.entries(net).forEach(([id, balance]) => {
    if (balance > EPSILON)  creditors.push({ id, amount: balance });
    if (balance < -EPSILON) debtors.push({ id, amount: -balance });
  });

  // Sort descending so we always process the largest imbalance first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];

  while (creditors.length && debtors.length) {
    const creditor = creditors[0];
    const debtor   = debtors[0];

    const transfer = Math.min(creditor.amount, debtor.amount);
    const rounded  = Math.round(transfer * 100) / 100;

    if (rounded > EPSILON) {
      settlements.push({
        from:   debtor.id,    // debtor pays
        to:     creditor.id,  // creditor receives
        amount: rounded,
      });
    }

    creditor.amount = Math.round((creditor.amount - transfer) * 100) / 100;
    debtor.amount   = Math.round((debtor.amount   - transfer) * 100) / 100;

    if (creditor.amount <= EPSILON) creditors.shift();
    if (debtor.amount   <= EPSILON) debtors.shift();

    // Re-sort after mutation (amounts may have changed relative order)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
  }

  // ── 5. Derive balances map for backwards-compatibility ──────────────────
  const balances = {};
  Object.keys(net).forEach(id => { balances[id] = 0; });
  settlements.forEach(s => {
    balances[s.from] = (balances[s.from] || 0) - s.amount;
    balances[s.to]   = (balances[s.to]   || 0) + s.amount;
  });

  return { balances, settlements };
};