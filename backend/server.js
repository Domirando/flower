import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Parser from 'rss-parser';

dotenv.config();

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Ported Telegram logic
app.post('/api/post-to-telegram', async (req, res) => {
    const { userId, text } = req.body;

    if (!userId || !text?.trim()) {
        return res.status(400).json({ error: 'User ID and text are required' });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('telegram_channel')
            .eq('id', userId)
            .single();

        if (error || !user?.telegram_channel) {
            return res.status(400).json({ error: 'No Telegram channel connected' });
        }

        const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const r = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: user.telegram_channel,
                text
            })
        });
        
        const telegramResp = await r.json();

        if (!telegramResp.ok) {
            return res.status(500).json({ error: 'Telegram post failed', telegramResp });
        }

        const { error: postError } = await supabase.from('posts').insert({
            user_id: userId,
            content: text
        });

        if (postError) {
            return res.status(500).json({ error: postError.message });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/news', async (req, res) => {
    const { interests } = req.query; // interests is a comma-separated string
    const BBC_RSS_URL = 'https://feeds.bbci.co.uk/news/rss.xml';

    try {
        const feed = await parser.parseURL(BBC_RSS_URL);
        console.log(`Successfully fetched ${feed.items.length} items from BBC RSS`);
        let items = feed.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            content: item.content,
            snippet: item.contentSnippet,
            thumbnail: item.enclosure?.url || (item.content?.match(/src="([^"]+)"/)?.[1])
        }));

        if (interests) {
            const interestList = interests.split(',').map(i => i.trim().toLowerCase());
            items = items.sort((a, b) => {
                const aMatch = interestList.some(i => a.title.toLowerCase().includes(i) || a.snippet?.toLowerCase().includes(i));
                const bMatch = interestList.some(i => b.title.toLowerCase().includes(i) || b.snippet?.toLowerCase().includes(i));
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            });
        }

        res.json({ items });
    } catch (err) {
        console.error('RSS fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.get('/api/books/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    try {
        // Google Books API is more reliable and free for searching
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20`);
        const data = await response.json();

        const books = data.items?.map(item => {
            const info = item.volumeInfo;
            return {
                id: item.id,
                title: info.title,
                authors: info.authors || [],
                description: info.description,
                thumbnail: info.imageLinks?.thumbnail,
                previewLink: info.previewLink,
                infoLink: info.infoLink,
                amazonLink: `https://www.amazon.com/s?k=${encodeURIComponent(info.title + ' ' + (info.authors?.[0] || ''))}&i=stripbooks`,
                zLibraryLink: `https://z-lib.gs/s/${encodeURIComponent(info.title)}`
            };
        }) || [];

        res.json({ books });
    } catch (err) {
        res.status(500).json({ error: 'Book search failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
