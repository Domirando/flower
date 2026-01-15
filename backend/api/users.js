// users.js
import { supabase } from "./supabase.js";

export async function upsertTelegramUser(tg) {
    const { data, error } = await supabase
        .from("users")
        .upsert(
            {
                telegram_id: tg.id,
                username: tg.username,
                first_name: tg.first_name,
                last_name: tg.last_name,
                photo_url: tg.photo_url,
            },
            { onConflict: "telegram_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}
