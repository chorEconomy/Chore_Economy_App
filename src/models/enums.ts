export enum EGender {
  Male = "male",
  Female = "female",
}

export enum ERole {
  Parent = "parent",
  Kid = "kid",
  Admin = "admin",
}

export enum EStatus {
  Active = "active",
  Inactive = "inactive",
  Disabled = "disabled",
}

export enum EChoreStatus {
  Completed = "completed",
  Approved = "approved",
  InProgress = "inprogress",
  Pending = "pending",
  All = "all",
  Denied = "denied",
  Unclaimed = "unclaimed"
}

export enum ExpenseStatus {
  Paid = "paid",
  Unpaid = "unpaid",
  All = "all"
}

export enum ESavingSchedule {
  Weekly = "weekly",
  BiWeekly = "biweekly",
  Monthly = "monthly"
} 

export enum ETransactionType {
  Credit = "credit",
  Debit = "debit"   
}

export enum ETransactionName { 
  ChorePayment = "chorePayment",
  Expense = "expense",
  SavingsDeposit = "savingsDeposit",
  Withdrawal = "withdrawal"
}