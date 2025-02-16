import { mailtrapClient, sender } from "../config/mailtrap.config";
const ejs = require("ejs");
const fs = require("fs");
const path = require("path"); 



export const sendVerificationEmail = async (userEmail: string, name: string, verificationToken: string) => {
  const recipient = [ {email: userEmail} ]

  try {
    const fileName = "verification_email_template.ejs"
    const templatePath = path.join(__dirname, '..', 'templates', `${fileName}`)
    const template = fs.readFileSync(templatePath, 'utf-8');
    const html = ejs.render(template, { name, verificationToken });  
    
    const response = await mailtrapClient
      .send({
        from: sender,
        to: recipient,
        subject: "Verify Your Account",
        html,
        category: "Account Verification",
      })
    console.log("Account verification email sent successfully", response);
  } catch (error) {
    console.error(`Error sending verification email`, error)
    throw new Error(`Error sending verification email: ${error}`)
  }

}


export const sendWelcomeEmail = async (name: string, email: string) => {
 try {
  const recipient = [{ email }]
  const fileName = "welcome_email_template.ejs"
  const templatePath = path.join(__dirname, '..', 'templates', `${fileName}`)
  const template = fs.readFileSync(templatePath, 'utf-8');
  const html = ejs.render(template, { name });  
  
  const response = await mailtrapClient
      .send({
        from: sender,
        to: recipient,
        subject: "Welcome to ChorEconomy Inc.",
        html,
        category: "Welcome Email",
      })
    console.log("Welcome email sent successfully", response);
 } catch (error) {
  console.error(`Error sending welcome email`, error)
  throw new Error(`Error sending welcome email: ${error}`)
 }
}


export const sendResetPasswordEmail = async (name: string, email: string, verificationToken: string) => {
 try {
  const recipient = [{ email }]
  const fileName = "reset_password_email_template.ejs"
  const templatePath = path.join(__dirname, '..', 'templates', `${fileName}`)
  const template = fs.readFileSync(templatePath, 'utf-8');
  const html = ejs.render(template, { name, verificationToken });  
  
  const response = await mailtrapClient
      .send({
        from: sender,
        to: recipient,
        subject: "Reset your Password",
        html,
        category: "Password Reset",
      })
    console.log("Reset password email sent successfully", response);
 } catch (error) {
  console.error(`Error sending reset password email`, error)
  throw new Error(`Error sending reset password email: ${error}`)
 }
}



