import { AuthService } from "./user.service.js";
class UserController {
    static async registerParent(req, res, next) {
        await AuthService.RegisterParent(req, res);
    }
    static async verifyEmail(req, res, next) {
        await AuthService.VerifyEmail(req, res);
    }
    static async resendOTP(req, res, next) {
        await AuthService.ResendOTP(req, res);
    }
    static async logout(req, res, next) {
        await AuthService.Logout(req, res);
    }
    static async login(req, res, next) {
        await AuthService.Login(req, res);
    }
    static async refreshToken(req, res, next) {
        await AuthService.RefreshToken(req, res);
    }
    static async forgotPassword(req, res, next) {
        await AuthService.ForgotPassword(req, res);
    }
    static async resetPassword(req, res, next) {
        await AuthService.ResetPassword(req, res);
    }
    static async editProfile(req, res, next) {
        await AuthService.EditProfile(req, res);
    }
    static async createKidProfile(req, res, next) {
        await AuthService.CreateKidProfile(req, res);
    }
    static async loginKid(req, res, next) {
        await AuthService.LoginKid(req, res);
    }
    static async fetchParent(req, res, next) {
        await AuthService.FetchParent(req, res);
    }
    static async fetchKid(req, res, next) {
        await AuthService.FetchKid(req, res);
    }
    static async fetchKidsForSingleParent(req, res, next) {
        await AuthService.FetchKidsForSingleParent(req, res);
    }
    static async deleteKidProfile(req, res, next) {
        await AuthService.DeleteKidProfile(req, res);
    }
    static async deleteParentProfile(req, res, next) {
        await AuthService.DeleteParent(req, res);
    }
}
export default UserController;
