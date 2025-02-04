import {User} from "../modules/users/user.model"

//Find one user in the db with the provided email
export async function check_if_user_exist_with_email(userEmail: string) {
    if (!userEmail) return false
    try {
        const user = await User.findOne({ email: userEmail });
        return user;
    } catch (error: any) {
        return error.message;
    }
}

//Find one user in the db with the provided ID
export async function check_if_user_exist_with_id(userId = "") {
    if (!userId) return false
    try {
        const user = await User.findOne({_id: userId });
        return user;
    } catch (error: any) {
        return error.message;
    }
}

export async function getUserByEmailAndRole(email: string, role: string) {
    try {
        const user = await User.findOne({ email, role });
        if (!user) {
            return false;
        } else {
            return user
        }
    } catch (error: any) {
        return error.message;
    }
}
