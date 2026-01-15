import { supabase } from "./supabase.js";

export async function insertPost({ content, author_id, telegram_message_id }) {
    const { error } = await supabase.from("posts").insert({
        content,
        author_id,
        telegram_message_id,
    });

    if (error) throw error;
}
