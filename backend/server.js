const express = require('express');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // To parse JSON payloads
app.use(cors()); // Allow cross-origin requests (useful for frontend-backend communication)

// Setup Nodemailer transporter (email service)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or another service like 'hotmail', 'smtp.mailtrap.io', etc.
    auth: {
        user: process.env.EMAIL,  // Your email address
        pass: process.env.EMAIL_PASSWORD,  // Your email password or app password
    }
});

app.post('/process-payment', async (req, res) => {
    const { orderID, userEmail, hwid } = req.body;

    if (!orderID || !userEmail || !hwid) {
        return res.status(400).json({ message: 'Missing required parameters' });
    }

    try {
        // Use PayPal REST API to verify the payment (change endpoint for production)
        const paypalResponse = await fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
            }
        });

        const paypalData = await paypalResponse.json();

        // Check if payment was successful
        if (paypalData.status === 'COMPLETED') {
            // Generate the license key using the KeyAuth API
            const keyAuthResponse = await fetch(`https://keyauth.win/api/seller/?sellerkey=9f889ee9b2606ed73c72ed19a924eef9&type=add&expiry=1&mask=******-******-******-******-******-******&level=1&amount=1&format=text`, {
                method: 'GET',
            });
            
            const keyAuthData = await keyAuthResponse.text(); // License key is expected in plain text
            
            // Send email with the license key
            const mailOptions = {
                from: process.env.EMAIL, // Sender address
                to: userEmail,  // List of recipients
                subject: 'Your Product License Key',  // Subject line
                text: `Thank you for your purchase! Here is your license key: ${keyAuthData}`, // Plain text body
            };

            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: 'Error sending email' });
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            // Respond with token
            const token = `license-token-for-${hwid}`;  // Example of token generation
            res.json({ token });
        } else {
            res.status(400).json({ message: 'Payment not completed successfully' });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Error processing payment' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
