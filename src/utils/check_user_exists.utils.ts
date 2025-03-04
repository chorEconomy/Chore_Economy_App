import { Kid, User } from "../modules/users/user.model.js";

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
export async function check_if_user_or_kid_exists(userId = ""): Promise<any> {
    if (!userId) return false;

    try {
        let user = await User.findById(userId);
        if (user) return user; // If a user is found, return it

        let kid = await Kid.findById(userId);
        if (kid) return kid; // If a kid is found, return it

        return false; 
    } catch (error: any) {
        console.error("Error checking user/kid existence:", error);
        return false;
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

export async function getKidByNameAndRole(name: string, role: string) {
    try {
        const kid = await Kid.findOne({ name, role });
        if (!kid) {
            return false;
        } else {
            return kid
        }
    } catch (error: any) {
        return error.message;
    }
}

