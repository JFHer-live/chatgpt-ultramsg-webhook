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
          messages: [{ role: "user", content: text }]
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: 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
          }
        }
      );

      const reply = gpt.data.choices[0].message.content;

      // 回覆訊息到 UltraMsg
      await axios.post("https://api.ultramsg.com/instance115545/messages/chat", {
        token: "56qu0ugexq5foc51",
        to,
        body: reply
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
