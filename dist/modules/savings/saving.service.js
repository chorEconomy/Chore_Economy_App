import calculateEndDate from "../../utils/converter.utils.js";
import paginate from "../../utils/paginate.js";
import { Saving } from "./saving.model.js";
class SavingService {
    static async createSaving(data, kidId) {
        const { title, startDate, totalSavingAmount, schedule, amountFrequency } = data;
        const endDate = calculateEndDate(startDate, totalSavingAmount, amountFrequency, schedule);
        const saving = await new Saving({
            kidId,
            title,
            startDate,
            endDate: endDate,
            totalSavingAmount,
            amountFrequency,
            schedule: schedule?.toLowerCase()
        });
        await saving.save();
        return saving;
    }
    static async fetchSaving(id, kidId) {
        const saving = await Saving.findOne({ kidId: kidId, _id: id });
        return saving;
    }
    static async fetchAllSavings(kidId, page, limit) {
        const savings = await paginate(Saving, page, limit, "", { kidId: kidId });
        return savings;
    }
    static async deleteSaving(id, kidId) {
        const saving = await Saving.findOneAndDelete({ kidId: kidId, _id: id });
        return saving;
    }
}
export default SavingService;
