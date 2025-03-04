import bcrypt from "bcrypt";
const comparePassword = async (user_password, stored_password) => {
    const isVerifiedPassword = await bcrypt.compareSync(user_password, stored_password);
    if (!isVerifiedPassword) {
        return false;
    }
    return true;
};
export default comparePassword;
