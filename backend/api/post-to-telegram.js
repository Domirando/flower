import fetch from "node-fetch";

export default async function handler(req, res) {
    // ✅ CORS headers
    res.setHeader("Access-Control-Allow-Origin", "https://flower-one-pi.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Handle preflight
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // ✅ Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { text } = req.body;

        const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: "@your_channel_username",
                text,
            }),
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Telegram send failed" });
    }
}
