export default function calculateEndDate(startDate, goalAmount, savingsPerPeriod, frequency) {
    if (typeof goalAmount !== "number" || goalAmount <= 0) {
        throw new Error("Goal amount must be a positive number");
    }
    if (typeof savingsPerPeriod !== "number" || savingsPerPeriod <= 0) {
        throw new Error("Savings per period must be a positive number");
    }
    // Parse start date
    const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    if (isNaN(start.getTime())) {
        throw new Error("Invalid start date value");
    }
    // Calculate number of periods needed
    const periods = Math.ceil(goalAmount / savingsPerPeriod);
    // Create a new date object to avoid modifying the original
    const endDate = new Date(start);
    // Calculate end date based on frequency
    switch (frequency) {
        case "weekly":
            endDate.setDate(endDate.getDate() + periods * 7);
            break;
        case "biweekly":
            endDate.setDate(endDate.getDate() + periods * 14);
            break;
        case "monthly":
            // More reliable month addition
            const originalDay = endDate.getDate();
            endDate.setMonth(endDate.getMonth() + periods);
            // Handle month overflow (e.g., Jan 31 + 1 month)
            if (endDate.getDate() !== originalDay) {
                endDate.setDate(0); // Move to last day of previous month
            }
            break;
        default:
            throw new Error("Invalid frequency. Use 'weekly', 'biweekly', or 'monthly'.");
    }
    // Return formatted date (YYYY-MM-DD)
    return endDate.toISOString().split("T")[0];
}
