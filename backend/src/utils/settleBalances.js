export const settleBalances = (expenses, members) => {
    const balances = {};

    members.forEach(member => {
        balances[member._id] = 0;
    });

    // Build balances
    expenses.forEach(exp => {
        const share = exp.amount / exp.splitamong.length;

        exp.splitamong.forEach(user => {
            balances[user] -= share;
        });

        balances[exp.paidby] += exp.amount;
    });

    // Separate
    const creditors = [];
    const debtors = [];

    for (let user in balances) {
        if (balances[user] > 0) {
            creditors.push({ user, amount: balances[user] });
        } else if (balances[user] < 0) {
            debtors.push({ user, amount: -balances[user] });
        }
    }

    // Settlements
    const settlements = [];

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debt = debtors[i];
        const credit = creditors[j];

        const amount = Math.min(debt.amount, credit.amount);

        settlements.push({
            from: debt.user,
            to: credit.user,
            amount
        });

        debt.amount -= amount;
        credit.amount -= amount;

        if (debt.amount === 0) i++;
        if (credit.amount === 0) j++;
    }

    return { balances, settlements };
};