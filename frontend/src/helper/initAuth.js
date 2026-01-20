import { supabase } from "./supabaseClient";
import { setUser, clearUser } from "../redux/state";

export const initAuth = async () => {
    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {
        setUser(session.user);
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            setUser(session.user);
        } else {
            clearUser();
        }
    });
};
