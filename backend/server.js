const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // To parse JSON payloads
app.use(cors()); // Allow cross-origin requests (useful for frontend-backend communication)

app.post('/process-payment', async (req, res) => {
    const { orderID, userID, hwid } = req.body;

    if (!orderID || !userID || !hwid) {
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
            // Handle post-payment processing here (e.g., generate token)
            const token = `license-token-for-${userID}-${hwid}`; // Example of token generation

            // Respond with token
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
