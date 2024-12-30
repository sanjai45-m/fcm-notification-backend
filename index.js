const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, 'keys/authen-48d46-firebase-adminsdk-afo8n-95b5c9405b.json')); // Update with the correct path to your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://authen-48d46-default-rtdb.firebaseio.com/', // Your Firebase Realtime Database URL
});

const app = express();
app.use(bodyParser.json());

const BATCH_SIZE = 100; // Batch size for sending notifications

app.post('/send-notification', async (req, res) => {
  const { message } = req.body;

  try {
    // Fetch all FCM tokens from the 'users' node
    const usersSnapshot = await admin.database().ref('users').once('value');
    const tokens = [];

    usersSnapshot.forEach(userSnapshot => {
      const fcmToken = userSnapshot.val().fcmToken;
      if (fcmToken) {
        tokens.push(fcmToken);
      }
    });

    if (tokens.length === 0) {
      return res.status(200).send('No tokens found to send notifications.');
    }

    // Process tokens in batches
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + BATCH_SIZE);

      const payload = {
        notification: {
          title: 'New Message',
          body: message,  // Display the actual message content here
        },
      };

      const response = await admin.messaging().sendToDevice(batchTokens, payload);
      // Log response for debugging if needed
      console.log(`Batch ${i / BATCH_SIZE + 1} response:`, response);
    }

    res.status(200).send('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Error sending notification');
  }
});

app.listen(9000, () => {
  console.log('Server running on port 9000');
});
