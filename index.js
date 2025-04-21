require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios');

app.use(express.json());

// Test endpoint to check if the server is running
app.get('/', (req, res) => {
    res.send('Webhook server is running!');
});

// Endpoint to handle UltraMSG Webhook requests
app.post('/', async (req, res) => {
    const message = req.body;
    console.log('Received message:', JSON.stringify(message, null, 2));

    // Extract the sender and message body directly from req.body
    const from = message.from;
    const text = message.body;

    // Check if required fields are present
    if (!from || !text) {
        console.log('Missing from or text field:', message);
        res.sendStatus(400); // Return 400 for invalid request
        return;
    }

    try {
        // Call OpenAI API
        console.log('Calling ChatGPT API with message:', text);
        const gpt = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: text }],
                max_tokens: 100,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        const reply = gpt.data.choices[0].message.content;
        console.log('ChatGPT response:', reply);

        // Send reply to UltraMSG
        console.log('Sending reply to UltraMSG:', { to: from, body: reply });
        await axios.post(
            'https://api.ultramsg.com/instance115545/messages/chat',
            {
                token: process.env.ULTRAMSG_TOKEN,
                to: from,
                body: reply,
            }
        );

        console.log('Reply sent successfully');
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }

    res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
