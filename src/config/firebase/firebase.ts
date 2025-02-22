import admin from "firebase-admin"
const serviceAccount = require("fcm-notification.json")



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
  
export const fcm = admin.messaging();

