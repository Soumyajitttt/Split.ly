export const formatExpenses = (expenses, userId) => {
    return expenses.map(exp => {
        const share = exp.amount / exp.splitAmong.length;

        const isPayer = exp.paidBy._id.toString() === userId.toString();

        return {
            title: exp.description,
            amount: exp.amount,
            paidBy: exp.paidBy.fullname,
            splitWith: exp.splitAmong.map(user =>
                user._id.toString() === userId.toString()
                    ? "You"
                    : user.fullname
            ),
            status: isPayer ? "YOU PAID" : "PENDING",
            youOwe: isPayer ? 0 : share
        };
    });
};