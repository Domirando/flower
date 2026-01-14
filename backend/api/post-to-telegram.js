import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", process.env.REACT_APP_FRONTEND_URL);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // 🔐 OPTIONAL: verify Supabase JWT from frontend
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: user, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Invalid user" });
        }

        const { text } = req.body;

        // 1️⃣ Send to Telegram
        const telegramRes = await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: "@domirandos",
                    text,
                }),
            }
        );

        const telegramData = await telegramRes.json();

        // 2️⃣ Save to Supabase
        const { data: post, error: dbError } = await supabase
            .from("posts")
            .insert({
                content: text,
                telegram_message_id: telegramData.result.message_id,
                author_id: user.user.id,
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return res.status(200).json({ success: true, post });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Post failed" });
    }
}
