export const formatExpenses = (expenses, userId) => {
    return expenses.map(exp => {
        const payerId  = (exp.paidby?._id || exp.paidby)?.toString();
        const isPayer  = payerId === userId.toString();
        const splitCount = exp.splitamong.length;
        const share    = splitCount > 0 ? exp.amount / splitCount : 0;
        const settledBy = (exp.settledBy || []).map(id => id.toString());

        const hasUserSettled = settledBy.includes(userId.toString());

        let othersOweYou = 0;
        if (isPayer) {
            exp.splitamong.forEach(u => {
                const uid = (u._id || u).toString();
                // Only count people who haven't settled yet
                if (uid !== payerId && !settledBy.includes(uid)) {
                    othersOweYou += share;
                }
            });
        }

        // It's settled if the payer got all their money back, or the debtor paid their share
        const isSettledForUser = isPayer ? othersOweYou === 0 : hasUserSettled;

        return {
            _id:          exp._id,
            title:        exp.description,
            amount:       exp.amount,
            paidBy:       exp.paidby?.fullname || exp.paidby?.username || 'Unknown',
            payerId,
            group:        exp.group, // ⬅️ THIS WAS THE MISSING LINK!
            splitWith:    exp.splitamong.map(u =>
                (u._id || u).toString() === userId.toString() ? 'You' : (u.fullname || u.username || '?')
            ),
            status:       isPayer ? (othersOweYou === 0 ? 'SETTLED' : 'YOU PAID') : (isSettledForUser ? 'SETTLED' : 'PENDING'),
            youOwe:       isPayer || isSettledForUser ? 0 : share,
            othersOweYou: isPayer ? othersOweYou : 0,
            settled:      exp.settled || isSettledForUser,
            settledAt:    exp.settledAt || null,
            createdAt:    exp.createdAt
        };
    });
};