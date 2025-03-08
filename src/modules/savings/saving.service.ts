import { ESavingSchedule } from "../../models/enums.js";
import calculateEndDate from "../../utils/converter.utils.js";
import paginate from "../../utils/paginate.js";
import { Kid } from "../users/user.model.js";
import { Saving } from "./saving.model.js";

class SavingService {
    static async createSaving(data: any, kidId: any) {
        const { title, startDate, totalSavingAmount, schedule, amountFrequency } = data
        
        const endDate = calculateEndDate(startDate, totalSavingAmount, amountFrequency, schedule)

        const saving = await new Saving({
            kidId,
            title,
            startDate,
            endDate: endDate,
            totalSavingAmount,
            amountFrequency,
            schedule: schedule?.toLowerCase() as ESavingSchedule
        })

        await saving.save();
        return saving
    }

    static async fetchSaving(id: any, kidId: any) {
        const saving = await Saving.findOne({ kidId: kidId, _id: id })
        return saving
    }

    static async fetchAllSavings(kidId: any, page: number, limit: number) {
        const savings = await paginate(Saving, page, limit, "", { kidId: kidId })
        return savings
    }

    static async deleteSaving(id: string, kidId: any) {
        const saving = await Saving.findOneAndDelete({ kidId: kidId, _id: id });
        return saving;
    }
    
} 

export default SavingService