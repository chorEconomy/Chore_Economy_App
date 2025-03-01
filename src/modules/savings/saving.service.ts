import { ESavingSchedule } from "../../models/enums"
import paginate from "../../utils/paginate";
import { Kid } from "../users/user.model";
import { Saving } from "./saving.model"

class SavingService {
    static async createSaving(data: any, kidId: any) {
        const {title, startDate, totalSavingAmount, schedule, amountFrequency} = data
        const saving = await new Saving({
            kidId,
            title,
            startDate,
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