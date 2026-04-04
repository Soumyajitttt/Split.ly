export const formatExpenses = (expenses, userId) => {
    return expenses.map(exp => {
        const share = exp.amount / exp.splitamong.length;

        const isPayer = exp.paidby._id.toString() === userId.toString();

        return {
            title: exp.description,
            amount: exp.amount,
            paidBy: exp.paidby.fullname,
            splitWith: exp.splitamong.map(user =>
                user._id.toString() === userId.toString()
                    ? "You"
                    : user.fullname
            ),
            status: isPayer ? "YOU PAID" : "PENDING",
            youOwe: isPayer ? 0 : share
        };
    });
};