// telegram.js
export async function postToTelegram(text) {
    const res = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHANNEL_ID,
                text,
            }),
        }
    );

    const data = await res.json();
    if (!data.ok) throw new Error("Telegram post failed");

    return data.result.message_id;
}
