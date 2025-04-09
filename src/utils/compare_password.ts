import bcrypt from "bcrypt"


const comparePassword = async (user_password: string, stored_password: string) => {
    if (!user_password || !stored_password) {
        throw new Error("Password or stored hash is missing!");
    }
    const trimmedPassword = user_password.trim();
    const result = await bcrypt.compare(trimmedPassword, stored_password);
    console.log(result);
    return result;
    
};


export default comparePassword