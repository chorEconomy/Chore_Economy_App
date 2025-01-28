export interface RegisterInputForParent {
    first_name: string
    last_name: string 
    phone_number: string
    email: string
    role: string
    password: string
    confirm_password: string
    gender: string
    country: string
}

export interface RegisterInputForAdmin {
    fullName: string
    email: string
    password: string
}

export interface loginInput {
    email: string
    password: string
}

export interface OTPInput {
    otp: string
}