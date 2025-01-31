const bcrypt = require("bcrypt");

const comparePassword = async (user_password: string, stored_password: string) => {
    const isVerifiedPassword = await bcrypt.compareSync(user_password, stored_password)
    if (!isVerifiedPassword) {
        return false
    }
    return true
}

export default comparePassword