import {apiConnector} from "../apiConnector";
import {authEndPoints} from "../apis";

export async function LoginUser(data: any) {
    return await apiConnector("POST", authEndPoints.LOGIN_API, data);
}

export async function RegisterUser(data: any) {
    return await apiConnector("POST", authEndPoints.REGISTER_API, data);
}

export async function VerifyEmail(token: string) {
    return await apiConnector("POST", authEndPoints.VERIFY_EMAIL_API + token);
}

export async function verify(token: string) {
    return await apiConnector("POST", authEndPoints.VERIFY_EMAIL + token);
}

export async function sentResetPassLink(data: any) {
    return await apiConnector("POST", authEndPoints.SENT_RESET_PASSWORD_API, data);
}

export async function verifyResetPassLink(token: string) {
    return await apiConnector("POST", authEndPoints.VERIFY_RESET_PASSWORD_API + token);
}

export async function resetPassword(token: string, data: any) {
    return await apiConnector("POST", authEndPoints.RESET_PASSWORD_API + token, data);
}

export async function LoginWithGoogle() {
    return await apiConnector("GET", authEndPoints.GOOGLE_LOGIN);
}

export async function LoginWithMe() {
    return await apiConnector("GET", authEndPoints.AUTH_ME);
}

export async function ChangePassword(oldPassword: string, newPassword: string) {
    return await apiConnector("POST", authEndPoints.CHANGE_PASSWORD_API, {oldPassword, newPassword});
}

export async function logOut() {
    return await apiConnector("POST", authEndPoints.LOGOUT);
}

export async function sendVerificationMail() {
    return await apiConnector("POST", authEndPoints.SEND_VERIFICATION_MAIL);
}
