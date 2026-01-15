import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    const allowedOrigins = [
        process.env.REACT_APP_FRONTEND_URL,
        "http://localhost:3000"
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') return res.status(405).end();
    const { userId, text } = req.body;

    if (!userId || !text?.trim()) return res.status(400).json({ error: 'User ID and text are required' });

    // Get user's Telegram channel
    const { data: user, error } = await supabase
        .from('users')
        .select('telegram_channel')
        .eq('id', userId)
        .single();

    console.log("Fetched user from Supabase:", user, error);

    if (error || !user?.telegram_channel) {
        return res.status(400).json({ error: 'No Telegram channel connected' });
    }

    // Post to Telegram
    let telegramResp;
    try {
        const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: user.telegram_channel,
                text
            })
        });
        telegramResp = await r.json();
    } catch (err) {
        return res.status(500).json({ error: 'Telegram request failed', details: err.message });
    }

    if (!telegramResp.ok) {
        return res.status(500).json({ error: 'Telegram post failed', telegramResp });
    }

    // Save post in Supabase
    const { error: postError } = await supabase.from('posts').insert({
        user_id: userId,
        content: text
    });

    if (postError) return res.status(500).json({ error: postError.message });

    res.json({ success: true });
}
