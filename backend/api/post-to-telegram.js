import fetch from "node-fetch";

export const config = {
    runtime: "nodejs18.x",
};

export default async function handler(req, res) {
    // ✅ CORS headers (must always be sent)
    const allowedOrigin = "https://flower-one-pi.vercel.app";
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Preflight request handling
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { text } = req.body;

        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

        const telegramRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: "@domirandos",
                text,
            }),
        });

        const data = await telegramRes.json();

        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Telegram send failed" });
    }
}
