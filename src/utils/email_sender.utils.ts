// import { mailtrapClient, sender } from "../config/mailtrap.config.js";
// import ejs from "ejs"
// import fs from "fs"
// import path from "path"



// export const sendVerificationEmail = async (userEmail: string, name: string, verificationToken: string) => {
//   const recipient = [ {email: userEmail} ]

//   try {
//     const fileName = "verification_email_template.ejs"
//     const templatePath = path.join(__dirname, '..', 'templates', `${fileName}`)
//     const template = fs.readFileSync(templatePath, 'utf-8');
//     const html = ejs.render(template, { name, verificationToken });  
    
//     const response = await mailtrapClient
//       .send({
//         from: sender,
//         to: recipient,
//         subject: "Verify Your Account",
//         html,
//         category: "Account Verification",
//       })
//     console.log("Account verification email sent successfully", response);
//   } catch (error) {
//     console.error(`Error sending verification email`, error)
//     throw new Error(`Error sending verification email: ${error}`)
//   }

// }


// export const sendWelcomeEmail = async (name: string, email: string) => {
//  try {
//   const recipient = [{ email }]
//   const fileName = "welcome_email_template.ejs"
//   const templatePath = path.join(__dirname, '..', 'templates', `${fileName}`)
//   const template = fs.readFileSync(templatePath, 'utf-8');
//   const html = ejs.render(template, { name });  
  
//   const response = await mailtrapClient
//       .send({
//         from: sender,
//         to: recipient,
//         subject: "Welcome to ChorEconomy Inc.",
//         html,
//         category: "Welcome Email",
//       })
//     console.log("Welcome email sent successfully", response);
//  } catch (error) {
//   console.error(`Error sending welcome email`, error)
//   throw new Error(`Error sending welcome email: ${error}`)
//  }
// }


// export const sendResetPasswordEmail = async (name: string, email: string, verificationToken: string) => {
//  try {
//   const recipient = [{ email }]
//   const fileName = "reset_password_email_template.ejs"
//   const templatePath = path.join(__dirname, '..', 'templates', `${fileName}`)
//   const template = fs.readFileSync(templatePath, 'utf-8');
//   const html = ejs.render(template, { name, verificationToken });  
  
//   const response = await mailtrapClient
//       .send({
//         from: sender,
//         to: recipient,
//         subject: "Reset your Password",
//         html,
//         category: "Password Reset",
//       })
//     console.log("Reset password email sent successfully", response);
//  } catch (error) {
//   console.error(`Error sending reset password email`, error)
//   throw new Error(`Error sending reset password email: ${error}`)
//  }
// }



import { mailtrapClient, sender } from "../config/mailtrap.config.js";
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendVerificationEmail = async (userEmail: string, name: string, verificationToken: string) => {
    const recipient = [{ email: userEmail }];
    try {
        const fileName = "verification_email_template.ejs";
        const templatePath = path.join(__dirname, '..', 'templates', fileName);
        console.log('Looking for template at:', templatePath); // Debug log
        
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { name, verificationToken });
        
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify Your Account",
            html,
            category: "Account Verification",
        });
        
        console.log("Account verification email sent successfully", response);
        return response;
    } catch (error) {
        console.error(`Error sending verification email`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

// Similar fixes for other email functions...
export const sendWelcomeEmail = async (name: string, email: string) => {
    try {
        const recipient = [{ email }];
        const fileName = "welcome_email_template.ejs";
        const templatePath = path.join(__dirname, '..', 'templates', fileName);
        console.log('Looking for template at:', templatePath); // Debug log
        
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { name });
        
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Welcome to ChorEconomy Inc.",
            html,
            category: "Welcome Email",
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
        const recipient = [{ email }];
        const fileName = "reset_password_email_template.ejs";
        const templatePath = path.join(__dirname, '..', 'templates', fileName);
        console.log('Looking for template at:', templatePath); // Debug log
        
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { name, verificationToken });
        
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset your Password",
            html,
            category: "Password Reset",
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