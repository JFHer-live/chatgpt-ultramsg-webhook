require("dotenv").config(); // 載入 .env 環境變數

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const axios = require("axios");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Webhook server is running!");
});

app.post("/", async (req, res) => {
  const message = req.body;
  console.log("收到訊息：", message);

  const to = message?.data?.from;
  const text = message?.data?.body;

  if (to && text) {
    try {
      // 呼叫 OpenAI API
      const gpt = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: text }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const reply = gpt.data.choices[0].message.content;

      // 回覆訊息到 UltraMsg
      await axios.post("https://api.ultramsg.com/instance115545/messages/chat", {
        token: process.env.ULTRAMSG_TOKEN,
        to,
        body: reply,
      });
    } catch (error) {
      console.error("發送錯誤：", error);
    }
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
