export default function calculateEndDate(startDate, goalAmount, savingsPerPeriod, frequency) {
    let start = new Date(startDate);
    let periods = Math.ceil(goalAmount / savingsPerPeriod);
    if (frequency === "weekly") {
        start.setDate(start.getDate() + periods * 7);
    }
    else if (frequency === "biweekly") {
        start.setDate(start.getDate() + periods * 14);
    }
    else if (frequency === "monthly") {
        for (let i = 0; i < periods; i++) {
            let currentMonth = start.getMonth();
            start.setMonth(currentMonth + 1);
            // Handle cases where new month has fewer days than the current date
            if (start.getDate() !== new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()) {
                start.setDate(1); // Move to the first of the next month
                start.setDate(start.getDate() - 1); // Adjust to last valid day
            }
        }
    }
    else {
        throw new Error("Invalid frequency. Use 'weekly', 'biweekly', or 'monthly'.");
    }
    return start.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}
// Example Usage:
const startDate = "2024-01-31"; // January 31
const goalAmount = 1000;
const savingsPerPeriod = 50;
const frequency = "monthly";
