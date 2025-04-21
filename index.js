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

    // 從 message.data 中提取 from 和 body
    const from = message.data?.from;
    const text = message.data?.body;

    // 檢查必要字段是否存在
    if (!from || !text) {
        console.log('缺少 from 或 text 欄位：', message);
        res.sendStatus(400); // 回覆 400 表示請求無效
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

        // 回覆訊息到 UltraMSG
        console.log('正在發送回覆到 UltraMSG：', { to: from, body: reply });
        await axios.post(
            'https://api.ultramsg.com/instance115545/messages/chat',
            {
                token: process.env.ULTRAMSG_TOKEN,
                to: from,
                body: reply,
            }
        );

        console.log('回覆已成功發送');
    } catch (error) {
        console.error('發送錯誤：', error.response?.data || error.message);
    }

    res.sendStatus(200);
});

// 啟動服務器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
