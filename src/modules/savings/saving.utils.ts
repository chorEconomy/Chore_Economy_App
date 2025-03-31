import { ESavingSchedule } from "../../models/enums.js";

export default class SavingUtils { 
    static calculateNextDueDate(lastPaymentDate: Date, schedule: ESavingSchedule): Date {
        const nextDue = new Date(lastPaymentDate);
        
        switch (schedule) {
            case ESavingSchedule.Weekly:
                nextDue.setDate(nextDue.getDate() + 7);
                break;
            case ESavingSchedule.BiWeekly:
                nextDue.setDate(nextDue.getDate() + 14);
                break;
            case ESavingSchedule.Monthly:
                nextDue.setMonth(nextDue.getMonth() + 1);
                // Handle month-end edge cases (e.g., Jan 31 → Feb 28)
                if (nextDue.getDate() !== new Date(lastPaymentDate).getDate()) {
                    nextDue.setDate(0); // Last day of previous month
                }
                break;
        }
        
        return nextDue;
    }

    static shouldSendReminder(today: Date, lastPaymentDate: Date, schedule: ESavingSchedule): boolean {
        const nextDueDate = this.calculateNextDueDate(lastPaymentDate, schedule);
        return today >= nextDueDate;
    }
}