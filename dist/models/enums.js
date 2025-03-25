export var EGender;
(function (EGender) {
    EGender["Male"] = "male";
    EGender["Female"] = "female";
})(EGender || (EGender = {}));
export var ERole;
(function (ERole) {
    ERole["Parent"] = "parent";
    ERole["Kid"] = "kid";
    ERole["Admin"] = "admin";
})(ERole || (ERole = {}));
export var EStatus;
(function (EStatus) {
    EStatus["Active"] = "active";
    EStatus["Inactive"] = "inactive";
    EStatus["Disabled"] = "disabled";
})(EStatus || (EStatus = {}));
export var EChoreStatus;
(function (EChoreStatus) {
    EChoreStatus["Completed"] = "completed";
    EChoreStatus["Approved"] = "approved";
    EChoreStatus["InProgress"] = "inprogress";
    EChoreStatus["Pending"] = "pending";
    EChoreStatus["All"] = "all";
    EChoreStatus["Denied"] = "denied";
    EChoreStatus["Unclaimed"] = "unclaimed";
})(EChoreStatus || (EChoreStatus = {}));
export var ExpenseStatus;
(function (ExpenseStatus) {
    ExpenseStatus["Paid"] = "paid";
    ExpenseStatus["Unpaid"] = "unpaid";
    ExpenseStatus["All"] = "all";
})(ExpenseStatus || (ExpenseStatus = {}));
export var ESavingSchedule;
(function (ESavingSchedule) {
    ESavingSchedule["Weekly"] = "weekly";
    ESavingSchedule["BiWeekly"] = "biweekly";
    ESavingSchedule["Monthly"] = "monthly";
})(ESavingSchedule || (ESavingSchedule = {}));
export var EPaymentSchedule;
(function (EPaymentSchedule) {
    EPaymentSchedule["Weekly"] = "weekly";
    EPaymentSchedule["BiWeekly"] = "biweekly";
    EPaymentSchedule["Monthly"] = "monthly";
})(EPaymentSchedule || (EPaymentSchedule = {}));
export var ETransactionType;
(function (ETransactionType) {
    ETransactionType["Credit"] = "credit";
    ETransactionType["Debit"] = "debit";
})(ETransactionType || (ETransactionType = {}));
export var ETransactionName;
(function (ETransactionName) {
    ETransactionName["ChorePayment"] = "chorePayment";
    ETransactionName["ExpensePayment"] = "expensePayment";
    ETransactionName["SavingsDeposit"] = "savingsDeposit";
    ETransactionName["SavingsWithdrawal"] = "savingsWithdrawal";
    ETransactionName["Withdrawal"] = "withdrawal";
})(ETransactionName || (ETransactionName = {}));
