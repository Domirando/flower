import express from "express";
import cors from "cors";

import { verifyTelegramAuth } from "./telegramAuth.js";
import { upsertTelegramUser } from "./users.js";
import { postToTelegram } from "./telegram.js";
import { insertPost } from "./posts.js";

const app = express();

app.use(cors({ origin: process.env.REACT_APP_FRONTEND_URL }));
app.use(express.json());

app.post("/api/post", async (req, res) => {
    try {
        const { telegramUser, content } = req.body;

        if (!telegramUser || !content) {
            return res.status(400).json({ error: "Missing user or content" });
        }

        // Verify Telegram login hash
        if (!verifyTelegramAuth(telegramUser)) {
            return res.status(401).json({ error: "Invalid Telegram auth" });
        }

        // Prevent replay attack (optional but recommended)
        const now = Math.floor(Date.now() / 1000);
        if (now - telegramUser.auth_date > 60) {
            return res.status(401).json({ error: "Login expired" });
        }

        // 1️⃣ Upsert user
        const user = await upsertTelegramUser(telegramUser);

        // 2️⃣ Post to Telegram
        const messageId = await postToTelegram(content);

        // 3️⃣ Save to Supabase
        await insertPost({
            content,
            author_id: user.id,
            telegram_message_id: messageId
        });

        res.json({ success: true, message_id: messageId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 3001, () =>
    console.log("Backend running on port 3001")
);
