import { MailtrapClient } from "mailtrap";
import * as dotenv from "dotenv";
dotenv.config();
export const mailtrapClient = new MailtrapClient({
    token: process.env.MAILTRAP_TOKEN,
});
export const sender = {
    email: "hello@demomailtrap.com",
    name: "Chore Economy Inc.",
};
