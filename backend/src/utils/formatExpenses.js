export const formatExpenses = (expenses, userId) => {
    return expenses.map(exp => {
        const payerId   = (exp.paidby?._id || exp.paidby)?.toString();
        const isPayer   = payerId === userId.toString();
        const settledBy = (exp.settledBy || []).map(id => id.toString());
        const hasUserSettled = settledBy.includes(userId.toString());

        // Determine per-user share
        let share = 0;
        let splitWithNames = [];

        if (exp.splitType === 'custom' && exp.customSplits?.length) {
            // Custom split: find this user's assigned amount
            const myEntry = exp.customSplits.find(cs =>
                (cs.user?._id || cs.user)?.toString() === userId.toString()
            );
            share = myEntry ? myEntry.amount : 0;
            splitWithNames = exp.customSplits.map(cs => {
                const uid = (cs.user?._id || cs.user)?.toString();
                return uid === userId.toString() ? 'You' : (cs.user?.fullname || cs.user?.username || '?');
            });
        } else {
            // Equal split
            const splitCount = exp.splitamong.length;
            share = splitCount > 0 ? exp.amount / splitCount : 0;
            splitWithNames = exp.splitamong.map(u =>
                (u._id || u).toString() === userId.toString() ? 'You' : (u.fullname || u.username || '?')
            );
        }

        // How much payer is still owed by others
        let othersOweYou = 0;
        if (isPayer) {
            if (exp.splitType === 'custom' && exp.customSplits?.length) {
                exp.customSplits.forEach(cs => {
                    const uid = (cs.user?._id || cs.user)?.toString();
                    if (uid !== payerId && !settledBy.includes(uid)) {
                        othersOweYou += cs.amount;
                    }
                });
            } else {
                const equalShare = exp.splitamong.length > 0 ? exp.amount / exp.splitamong.length : 0;
                exp.splitamong.forEach(u => {
                    const uid = (u._id || u).toString();
                    if (uid !== payerId && !settledBy.includes(uid)) {
                        othersOweYou += equalShare;
                    }
                });
            }
        }

        const isSettledForUser = isPayer ? othersOweYou === 0 : hasUserSettled;

        return {
            _id:          exp._id,
            title:        exp.description,
            amount:       exp.amount,
            paidBy:       exp.paidby?.fullname || exp.paidby?.username || 'Unknown',
            payerId,
            group:        exp.group,
            splitType:    exp.splitType || 'equal',
            splitWith:    splitWithNames,
            status:       isPayer ? (othersOweYou === 0 ? 'SETTLED' : 'YOU PAID') : (isSettledForUser ? 'SETTLED' : 'PENDING'),
            youOwe:       isPayer || isSettledForUser ? 0 : share,
            othersOweYou: isPayer ? othersOweYou : 0,
            settled:      exp.settled || isSettledForUser,
            settledAt:    exp.settledAt || null,
            createdAt:    exp.createdAt
        };
    });
};