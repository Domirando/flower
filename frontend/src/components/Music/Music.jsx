import { useCallback, useEffect, useRef, useState } from 'react';
import { api, uploadFileToR2 } from '../../api/client';
import styles from './Music.module.css';

// ── Spotify Web Playback SDK loader ──────────────────────────────────────────
let sdkReady = false;
function loadSpotifySdk(onReady) {
    if (sdkReady) { onReady(); return; }
    window.onSpotifyWebPlaybackSDKReady = () => { sdkReady = true; onReady(); };
    if (!document.getElementById('spotify-sdk')) {
        const s = document.createElement('script');
        s.id = 'spotify-sdk';
        s.src = 'https://sdk.scdn.co/spotify-player.js';
        document.body.appendChild(s);
    }
}

export default function Music() {
    // ── own songs ────────────────────────────────────────────────────────────
    const [songs, setSongs] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
    const [isDragging, setIsDragging] = useState(false);
    const [activeSong, setActiveSong] = useState(null);
    const [audioUrl, setAudioUrl] = useState('');
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    // ── spotify ──────────────────────────────────────────────────────────────
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [spotifyLoading, setSpotifyLoading] = useState(true);
    const [playlists, setPlaylists] = useState([]);
    const [playlistsLoading, setPlaylistsLoading] = useState(false);
    const [spotifyPlayer, setSpotifyPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState('');
    const [nowPlaying, setNowPlaying] = useState(null);

    // ── load songs & Spotify status on mount ─────────────────────────────────
    useEffect(() => {
        api.getSongs().then(({ songs }) => setSongs(songs)).catch(() => {});

        const params = new URLSearchParams(window.location.search);
        if (params.get('spotify_connected')) {
            window.history.replaceState({}, '', '/music');
        }
        if (params.get('spotify_error')) {
            alert('Spotify connection failed: ' + params.get('spotify_error'));
            window.history.replaceState({}, '', '/music');
        }

        api.getSpotifyStatus()
            .then(({ connected }) => {
                setSpotifyConnected(connected);
                if (connected) loadPlaylists();
            })
            .catch(() => {})
            .finally(() => setSpotifyLoading(false));
    }, []);

    // ── Spotify SDK init when connected ──────────────────────────────────────
    useEffect(() => {
        if (!spotifyConnected) return;
        loadSpotifySdk(() => {
            api.getSpotifyToken().then(({ access_token }) => {
                const player = new window.Spotify.Player({
                    name: 'Flower',
                    getOAuthToken: cb => cb(access_token),
                    volume: 0.8,
                });
                player.addListener('ready', ({ device_id }) => setDeviceId(device_id));
                player.addListener('player_state_changed', (state) => {
                    if (state?.track_window?.current_track) {
                        setNowPlaying(state.track_window.current_track);
                    }
                });
                player.connect();
                setSpotifyPlayer(player);
            }).catch(() => {});
        });
    }, [spotifyConnected]);

    const loadPlaylists = () => {
        setPlaylistsLoading(true);
        api.getSpotifyPlaylists()
            .then(({ playlists: p }) => setPlaylists(Array.isArray(p) ? p : []))
            .catch(() => {})
            .finally(() => setPlaylistsLoading(false));
    };

    // ── Spotify OAuth ─────────────────────────────────────────────────────────
    const connectSpotify = async () => {
        try {
            const { url } = await api.getSpotifyAuthUrl();
            window.location.href = url;
        } catch (err) {
            alert(err.message);
        }
    };

    const disconnectSpotify = async () => {
        await api.disconnectSpotify();
        setSpotifyConnected(false);
        setPlaylists([]);
        if (spotifyPlayer) { spotifyPlayer.disconnect(); setSpotifyPlayer(null); }
    };

    // ── Spotify playback ──────────────────────────────────────────────────────
    const playSpotifyPlaylist = async (playlist) => {
        if (!deviceId) {
            window.open(playlist.external_urls?.spotify, '_blank');
            return;
        }
        try {
            const { access_token } = await api.getSpotifyToken();
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ context_uri: playlist.uri }),
            });
        } catch {
            window.open(playlist.external_urls?.spotify, '_blank');
        }
    };

    // ── own songs: file upload (direct R2 via presigned URL) ─────────────────
    const processAudioFile = useCallback(async (file) => {
        if (!file) return;
        const isAudio = file.type.startsWith('audio') || /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(file.name);
        if (!isAudio) {
            alert('Please upload an audio file (MP3, WAV, FLAC, OGG, M4A, AAC)');
            return;
        }

        setUploadingFile(true);
        setUploadProgress(0);
        try {
            // Upload directly to R2 with progress
            const { public_url, key } = await uploadFileToR2(
                file,
                'songs',
                (pct) => setUploadProgress(pct)
            );

            // Save metadata to backend
            const title = file.name.replace(/\.[^.]+$/, '');
            const { song } = await api.saveSong({ title, artist: '', file_url: public_url, file_key: key });
            setSongs(prev => [song, ...prev]);
        } catch (err) {
            // Fallback: send file through backend if R2 not configured
            if (err.message.includes('R2 storage is not configured')) {
                setUploadProgress(null);
                try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const { song } = await api.uploadSong(fd);
                    setSongs(prev => [song, ...prev]);
                } catch (fallbackErr) {
                    alert('Upload failed: ' + fallbackErr.message);
                }
            } else {
                alert('Upload failed: ' + err.message);
            }
        } finally {
            setUploadingFile(false);
            setUploadProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processAudioFile(e.dataTransfer.files[0]);
    };

    // ── own songs: playback ───────────────────────────────────────────────────
    const playSong = (song) => {
        if (activeSong === song.id) {
            if (audioRef.current?.paused) audioRef.current.play();
            else audioRef.current?.pause();
            return;
        }
        setActiveSong(song.id);
        setAudioUrl(song.file_url);
        setTimeout(() => audioRef.current?.play(), 50);
    };

    const deleteSong = async (id) => {
        if (!window.confirm('Delete this song?')) return;
        try {
            await api.deleteSong(id);
            setSongs(prev => prev.filter(s => s.id !== id));
            if (activeSong === id) { setActiveSong(null); setAudioUrl(''); }
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className={styles.page}>

            {/* ── Your Music ─────────────────────────────────────────────── */}
            <section className={styles.section}>
                <h2 className={styles.section_title}>🎵 Your Music</h2>

                {/* Drop zone */}
                <div
                    className={`${styles.drop_zone} ${isDragging ? styles.drop_zone_active : ''} ${uploadingFile ? styles.drop_zone_uploading : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !uploadingFile && fileInputRef.current.click()}
                >
                    {uploadingFile ? (
                        <div className={styles.upload_progress_wrap}>
                            {uploadProgress !== null ? (
                                <>
                                    <div className={styles.progress_bar}>
                                        <div
                                            className={styles.progress_fill}
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <span>{uploadProgress}%</span>
                                </>
                            ) : (
                                <span>Saving…</span>
                            )}
                        </div>
                    ) : (
                        <span>🎧 Drop an audio file here — or click to upload</span>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.flac,.ogg,.m4a,.aac,audio/*"
                        onChange={(e) => processAudioFile(e.target.files[0])}
                        className={styles.hidden_input}
                    />
                </div>

                {/* Audio element */}
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    className={`${styles.audio_player} ${audioUrl ? '' : styles.hidden}`}
                    onEnded={() => setActiveSong(null)}
                />

                {/* Song list */}
                {songs.length === 0 ? (
                    <p className={styles.empty}>No songs yet. Upload your first track above.</p>
                ) : (
                    <ul className={styles.song_list}>
                        {songs.map((song) => (
                            <li key={song.id} className={`${styles.song_item} ${activeSong === song.id ? styles.song_active : ''}`}>
                                <button className={styles.play_btn} onClick={() => playSong(song)} title="Play / Pause">
                                    {activeSong === song.id ? '⏸' : '▶'}
                                </button>
                                <div className={styles.song_info}>
                                    <span className={styles.song_title}>{song.title}</span>
                                    {song.artist && <span className={styles.song_artist}>{song.artist}</span>}
                                </div>
                                <button className={styles.delete_btn} onClick={() => deleteSong(song.id)} title="Delete">🗑</button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* ── Spotify ────────────────────────────────────────────────── */}
            <section className={styles.section}>
                <div className={styles.spotify_header}>
                    <h2 className={styles.section_title}>🟢 Spotify</h2>
                    {spotifyConnected && (
                        <button className={styles.disconnect_btn} onClick={disconnectSpotify}>
                            Disconnect
                        </button>
                    )}
                </div>

                {spotifyLoading ? (
                    <p className={styles.empty}>Checking Spotify connection…</p>
                ) : spotifyConnected ? (
                    <>
                        {nowPlaying && (
                            <div className={styles.now_playing}>
                                <img src={nowPlaying.album?.images?.[2]?.url} alt="" className={styles.np_thumb} />
                                <div>
                                    <span className={styles.np_title}>{nowPlaying.name}</span>
                                    <span className={styles.np_artist}>{nowPlaying.artists?.map(a => a.name).join(', ')}</span>
                                </div>
                            </div>
                        )}

                        {playlistsLoading ? (
                            <p className={styles.empty}>Loading playlists…</p>
                        ) : playlists.length === 0 ? (
                            <p className={styles.empty}>No playlists found.</p>
                        ) : (
                            <div className={styles.playlist_grid}>
                                {playlists.map((pl) => (
                                    <div key={pl.id} className={styles.playlist_card}>
                                        <img
                                            src={pl.images?.[0]?.url || 'https://via.placeholder.com/200'}
                                            alt={pl.name}
                                            className={styles.playlist_img}
                                        />
                                        <div className={styles.playlist_info}>
                                            <span className={styles.playlist_name}>{pl.name}</span>
                                            <span className={styles.playlist_tracks}>{pl.tracks?.total ?? '?'} tracks</span>
                                        </div>
                                        <div className={styles.playlist_actions}>
                                            <button
                                                className={styles.play_playlist_btn}
                                                onClick={() => playSpotifyPlaylist(pl)}
                                                title={deviceId ? 'Play here' : 'Open in Spotify'}
                                            >
                                                {deviceId ? '▶ Play' : '↗ Open'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.spotify_connect}>
                        <p className={styles.spotify_desc}>
                            Connect your Spotify account to see your playlists and play music
                            directly in the app (Spotify Premium required for in-app playback).
                        </p>
                        <button className={styles.spotify_btn} onClick={connectSpotify}>
                            Connect Spotify
                        </button>
                        <p className={styles.spotify_note}>
                            Requires <code>SPOTIFY_CLIENT_ID</code> and <code>SPOTIFY_CLIENT_SECRET</code> on the server.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
