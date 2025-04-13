import {Resend} from "resend"
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from "dotenv";
dotenv.config()


// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY as string);
const sender = process.env.SENDER_EMAIL as string

export const sendVerificationEmail = async (userEmail: string, name: string, verificationToken: string) => {
   
    try {
        const fileName = "verification_email_template.ejs";
        const templatePath = path.join(__dirname, '..', 'templates', fileName);
        console.log('Looking for template at:', templatePath); // Debug log
        
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { name, verificationToken });
        
        await resend.emails.send({
            from: `${sender}`,
            to: userEmail,
            subject: "Verify Your Account",
            html: html, 
        });
        
        

    } catch (error) {
        console.error(`Error sending verification email`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

// Similar fixes for other email functions...
export const sendWelcomeEmail = async (name: string, email: string) => {
    try {
        const fileName = "welcome_email_template.ejs";
        const templatePath = path.join(__dirname, '..', 'templates', fileName);
        console.log('Looking for template at:', templatePath); // Debug log
        
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { name });
        
        const response = await resend.emails.send({
            from: `${sender}`,
            to: email,
            subject: "Welcome to Chor",
            html: html,
        });
        
        console.log("Welcome email sent successfully", response);
        return response;
    } catch (error) {
        console.error(`Error sending welcome email`, error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
};

export const sendResetPasswordEmail = async (name: string, email: string, verificationToken: string) => {
    try {
        const fileName = "reset_password_email_template.ejs";
        const templatePath = path.join(__dirname, '..', 'templates', fileName);
        console.log('Looking for template at:', templatePath); // Debug log
        
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { name, verificationToken });
        
        const response = await resend.emails.send({
            from: `${sender}`,
            to: email,
            subject: "Reset your Password",
            html: html, 
        });
        
        console.log("Reset password email sent successfully", response);
        return response;
    } catch (error) {
        console.error(`Error sending reset password email`, error);
        throw new Error(`Error sending reset password email: ${error}`);
    }
};

export const sendResetEmail = async(user: any, otp: string) => {
    const name = await user.firstName || user.fullName;
    sendResetPasswordEmail(name, user.email, otp);
}