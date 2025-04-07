import { fcm } from "../config/firebase/firebase.js";
const sendNotification = async (token, title, body, data) => {
    try {
        if (!token) {
            console.log('No FCM token found');
            return;
        }
        const message = {
            token: token,
            notification: { title, body },
            android: { priority: "high" },
            apns: { payload: { aps: { sound: "default" } } },
            data: data || {},
        };
        await fcm.send(message);
        console.log('Notification sent successfully!');
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
};
export default sendNotification;
