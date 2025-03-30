import bcrypt from "bcrypt";
const comparePassword = async (user_password, stored_password) => {
    console.log("Entered Password:", user_password);
    console.log("Stored Password from DB:", stored_password);
    if (!user_password || !stored_password) {
        throw new Error("Password or stored hash is missing!");
    }
    const trimmedPassword = user_password.trim();
    return await bcrypt.compare(trimmedPassword, stored_password);
};
export default comparePassword;
