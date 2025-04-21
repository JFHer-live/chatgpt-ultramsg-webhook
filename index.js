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
    await axios.post("https://api.ultramsg.com/你的_INSTANCE_ID/messages/chat", {
      token: "你的_TOKEN",
      to,
      body: `你剛剛說了：${text}`,
    });
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
