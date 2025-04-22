require('dotenv').config(); // 載入 .env 環境變數

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios');

app.use(express.json());

// 測試服務器是否正常運行的端點
app.get('/', (req, res) => {
    res.send('Webhook server is running!');
});

// 處理 UltraMSG Webhook 請求的端點
app.post('/', async (req, res) => {
    const message = req.body;
    console.log('收到訊息：', JSON.stringify(message, null, 2));

    // 從 message.data 中提取 from, body 和 fromMe
    const from = message.data?.from; // 例如 "19056588845@c.us"
    const text = message.data?.body;
    const fromMe = message.data?.fromMe;

    // 檢查必要字段是否存在
    if (!from || !text) {
        console.log('缺少 from 或 text 欄位：', message);
        res.sendStatus(400); // 回覆 400 表示請求無效
        return;
    }

    // 如果訊息是自己發送的（fromMe: true），則不回覆
    if (fromMe) {
        console.log('訊息是自己發送的，不予回覆：', message);
        res.sendStatus(200);
        return;
    }

    try {
        // 呼叫 OpenAI API
        console.log('正在呼叫 ChatGPT API，訊息：', text);
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
        console.log('ChatGPT 回應：', reply);

        // 將 from 轉換為 +19056588845 格式
        const toNumber = '+' + from.split('@')[0]; // 從 "19056588845@c.us" 轉為 "+19056588845"
        console.log('轉換後的回覆目標號碼：', toNumber);

        // 回覆訊息到 UltraMSG，使用轉換後的號碼
        console.log('正在發送回覆到 UltraMSG：', { to: toNumber, body: reply });
        const response = await axios.post(
            'https://api.ultramsg.com/instance115545/messages/chat',
            {
                token: process.env.ULTRAMSG_TOKEN,
                to: toNumber, // 使用轉換後的號碼
                body: reply,
            }
        );

        console.log('UltraMSG API 回應：', response.data);
        console.log('回覆已成功發送');
    } catch (error) {
        console.error('發送錯誤：', error
