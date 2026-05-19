export const settleBalances = (expenses, members) => {
    const balances = {};
    members.forEach(member => {
        balances[member._id.toString()] = 0;
    });

    // We process ALL expenses unless they are fully settled
    expenses.forEach(exp => {
        if (exp.settled) return;

        const splitCount = exp.splitamong.length;
        if (!splitCount) return;

        const share    = exp.amount / splitCount;
        const payerId  = (exp.paidby._id || exp.paidby).toString();
        const settledBy = (exp.settledBy || []).map(id => id.toString());

        exp.splitamong.forEach(user => {
            const uid = (user._id || user).toString();

            // Apply debt ONLY IF the user is not the payer AND hasn't settled yet
            if (uid !== payerId && !settledBy.includes(uid)) {
                if (uid in balances) balances[uid] -= share;
                if (payerId in balances) balances[payerId] += share;
            }
        });
    });

    const creditors = [];
    const debtors   = [];

    for (const [user, amount] of Object.entries(balances)) {
        if (amount >  0.01) creditors.push({ user, amount });
        if (amount < -0.01) debtors.push({ user, amount: -amount });
    }

    const settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debt   = debtors[i];
        const credit = creditors[j];
        const pay    = Math.min(debt.amount, credit.amount);

        if (pay > 0.01) {
            settlements.push({
                from:   debt.user,
                to:     credit.user,
                amount: Math.round(pay * 100) / 100
            });
        }

        debt.amount   -= pay;
        credit.amount -= pay;

        if (debt.amount   < 0.01) i++;
        if (credit.amount < 0.01) j++;
    }

    return { balances, settlements };
};