import admin from "firebase-admin"
import * as dotenv from "dotenv";
dotenv.config();

const serviceAccount: any = process.env.FCM_CREDENTIALS;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
  
export const fcm = admin.messaging();

