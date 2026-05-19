export const settleBalances = (expenses, members) => {
    const matrix = {};
    
    // Initialize matrix for all member pairs
    members.forEach(m1 => {
        const id1 = m1._id.toString();
        matrix[id1] = {};
        members.forEach(m2 => {
            matrix[id1][m2._id.toString()] = 0;
        });
    });

    expenses.forEach(exp => {
        if (exp.settled) return;

        const payerId = (exp.paidby?._id || exp.paidby).toString();
        
        if (!matrix[payerId]) matrix[payerId] = {};

        // If it is a settlement transaction, reduce the payer's debt to the receiver
        if (exp.splitType === 'settlement') {
            const receiverId = (exp.splitamong?.[0]?._id || exp.splitamong?.[0])?.toString();
            if (receiverId) {
                if (!matrix[receiverId]) matrix[receiverId] = {};
                matrix[payerId][receiverId] = (matrix[payerId][receiverId] || 0) - exp.amount;
            }
            return;
        }

        const settledBy = (exp.settledBy || []).map(id => id.toString());

        if (exp.splitType === 'custom' && exp.customSplits?.length) {
            exp.customSplits.forEach(cs => {
                const uid = (cs.user?._id || cs.user).toString();
                if (uid === payerId) return;
                if (!settledBy.includes(uid)) {
                    if (!matrix[uid]) matrix[uid] = {};
                    matrix[uid][payerId] = (matrix[uid][payerId] || 0) + cs.amount;
                }
            });
        } else {
            const splitCount = exp.splitamong?.length || 0;
            if (!splitCount) return;
            const share = exp.amount / splitCount;

            exp.splitamong.forEach(user => {
                const uid = (user._id || user).toString();
                if (uid === payerId) return;
                if (!settledBy.includes(uid)) {
                    if (!matrix[uid]) matrix[uid] = {};
                    matrix[uid][payerId] = (matrix[uid][payerId] || 0) + share;
                }
            });
        }
    });

    // Net out the pairwise debts directly between individual pairs
    const allUserIds = new Set(members.map(m => m._id.toString()));
    Object.keys(matrix).forEach(id => allUserIds.add(id));
    const memberIds = Array.from(allUserIds);
    const settlements = [];

    for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
            const u1 = memberIds[i];
            const u2 = memberIds[j];

            const debt1 = matrix[u1]?.[u2] || 0; // u1 owes u2
            const debt2 = matrix[u2]?.[u1] || 0; // u2 owes u1

            if (Math.abs(debt1 - debt2) > 0.01) {
                if (debt1 > debt2) {
                    const netDebt = debt1 - debt2;
                    settlements.push({
                        from: u1,
                        to: u2,
                        amount: Math.round(netDebt * 100) / 100
                    });
                } else {
                    const netDebt = debt2 - debt1;
                    settlements.push({
                        from: u2,
                        to: u1,
                        amount: Math.round(netDebt * 100) / 100
                    });
                }
            }
        }
    }

    // Generate balances object for backwards compatibility
    const balances = {};
    memberIds.forEach(id => {
        balances[id] = 0;
    });
    settlements.forEach(s => {
        balances[s.from] -= s.amount;
        balances[s.to] += s.amount;
    });

    return { balances, settlements };
};