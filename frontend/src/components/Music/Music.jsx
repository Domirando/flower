import { useEffect, useState } from 'react';
import { supabase } from "../../helper/supabaseClient";
import styles from './Music.module.css';

export default function Music() {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkSpotifyAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkSpotifyAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Supabase stores provider tokens in the session
        const providerToken = session?.provider_token;
        
        if (providerToken) {
            setIsAuthorized(true);
            fetchPlaylists(providerToken);
        } else {
            // Check if they are signed in at all
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // User is signed in but maybe not with Spotify or session expired
                setIsAuthorized(false);
            } else {
                setIsAuthorized(false);
            }
            setLoading(false);
        }
    };

    const handleAuthorize = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'spotify',
            options: {
                scopes: 'playlist-read-private playlist-read-collaborative',
                redirectTo: window.location.origin + '/music'
            }
        });
        if (error) console.error("Error authorizing with Spotify:", error.message);
    };

    const fetchPlaylists = async (token) => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('https://api.spotify.org/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                // Token likely expired
                setIsAuthorized(false);
                return;
            }

            const data = await response.json();
            if (data.items) {
                setPlaylists(data.items);
            } else if (data.error) {
                console.error("Spotify API error:", data.error);
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error("Error fetching Spotify playlists:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loader}>Loading Music...</div>;

    if (!isAuthorized) {
        return (
            <div className={styles.auth_container}>
                <h1>Music</h1>
                <p>Connect your Spotify account to see your playlists.</p>
                <button onClick={handleAuthorize} className={styles.spotify_btn}>
                    Authorize Spotify
                </button>
            </div>
        );
    }

    return (
        <div className={styles.music_container}>
            <h1>My Spotify Playlists</h1>
            <div className={styles.playlist_grid}>
                {playlists.length > 0 ? (
                    playlists.map(playlist => (
                        <div key={playlist.id} className={styles.playlist_card}>
                            <img src={playlist.images?.[0]?.url || 'https://via.placeholder.com/150'} alt={playlist.name} />
                            <h3>{playlist.name}</h3>
                            <p>{playlist.tracks.total} tracks</p>
                            <a href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                                Open in Spotify
                            </a>
                        </div>
                    ))
                ) : (
                    <p>No playlists found.</p>
                )}
            </div>
        </div>
    );
}