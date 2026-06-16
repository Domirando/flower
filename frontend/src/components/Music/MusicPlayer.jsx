import { useState, useCallback } from 'react';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import styles from './MusicPlayer.module.css';
import { HiPlay, HiPause, HiMusicNote, HiMenuAlt2, HiX, HiArrowsExpand } from 'react-icons/hi';
import { HiBackward, HiForward, HiArrowsPointingIn } from 'react-icons/hi2';

function fmt(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

async function fetchLyrics(title, artist) {
    if (!title) throw new Error('No track info');
    const cleanArtist = (artist || '').split(',')[0].trim(); // first artist only
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist || 'unknown')}/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Lyrics not found');
    const data = await res.json();
    if (!data.lyrics) throw new Error('Lyrics not found');
    return data.lyrics;
}

export default function MusicPlayer() {
    const {
        currentTrack, isPlaying, currentTime, duration,
        togglePlay, seek, playNext, playPrev,
        spotifyState,
    } = useMusicPlayer();

    const [showLyrics, setShowLyrics] = useState(false);
    const [lyricsExpanded, setLyricsExpanded] = useState(false);
    const [lyrics, setLyrics] = useState(null);
    const [lyricsLoading, setLyricsLoading] = useState(false);
    const [lyricsError, setLyricsError] = useState(null);
    const [lastFetchKey, setLastFetchKey] = useState(null);

    // Normalise whichever source is active into one shape
    let active = null;

    if (spotifyState?.track) {
        const { track, playlistName, isPaused, position, duration: spDur, controls } = spotifyState;
        active = {
            title: track.name,
            artist: track.artists?.map(a => a.name).join(', ') || '',
            subtitle: playlistName || null,
            image: track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || null,
            playing: !isPaused,
            currentTime: position / 1000,
            duration: spDur / 1000,
            onToggle: controls.toggle,
            onPrev: controls.prev,
            onNext: controls.next,
            onSeek: (sec) => controls.seek(sec * 1000),
        };
    } else if (currentTrack) {
        active = {
            title: currentTrack.title,
            artist: currentTrack.artist || '',
            subtitle: null,
            image: null,
            playing: isPlaying,
            currentTime,
            duration,
            onToggle: togglePlay,
            onPrev: playPrev,
            onNext: playNext,
            onSeek: seek,
        };
    }

    const handleLyrics = useCallback(async () => {
        if (!active) return;
        const fetchKey = `${active.title}||${active.artist}`;

        if (showLyrics) {
            setShowLyrics(false);
            return;
        }

        setShowLyrics(true);

        // Don't re-fetch if we already have lyrics for this track
        if (fetchKey === lastFetchKey && (lyrics || lyricsError)) return;

        setLyricsLoading(true);
        setLyrics(null);
        setLyricsError(null);
        setLastFetchKey(fetchKey);

        try {
            const text = await fetchLyrics(active.title, active.artist);
            setLyrics(text);
        } catch (err) {
            setLyricsError(err.message);
        } finally {
            setLyricsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, showLyrics, lastFetchKey, lyrics, lyricsError]);

    if (!active) return null;

    return (
        <>
            {/* ── Lyrics panel ───────────────────────────────────────────── */}
            {showLyrics && (
                <div className={`${styles.lyrics_panel} ${lyricsExpanded ? styles.lyrics_panel_expanded : ''}`}>
                    <div className={styles.lyrics_header}>
                        <span className={styles.lyrics_title}>
                            {active.title} {active.artist && `— ${active.artist}`}
                        </span>
                        <button
                            className={styles.lyrics_close}
                            onClick={() => setLyricsExpanded(e => !e)}
                            title={lyricsExpanded ? 'Collapse' : 'Expand'}
                        >
                            {lyricsExpanded ? <HiArrowsPointingIn size={18} /> : <HiArrowsExpand size={18} />}
                        </button>
                        <button className={styles.lyrics_close} onClick={() => { setShowLyrics(false); setLyricsExpanded(false); }}>
                            <HiX size={18} />
                        </button>
                    </div>
                    <div className={styles.lyrics_body}>
                        {lyricsLoading && <p className={styles.lyrics_status}>Fetching lyrics…</p>}
                        {lyricsError && <p className={styles.lyrics_status}>{lyricsError}</p>}
                        {lyrics && <pre className={styles.lyrics_text}>{lyrics}</pre>}
                    </div>
                </div>
            )}

            {/* ── Player bar ─────────────────────────────────────────────── */}
            <div className={styles.player}>
                <div className={styles.track_info}>
                    {active.image
                        ? <img src={active.image} alt="" className={styles.thumb} />
                        : <HiMusicNote size={20} className={styles.note_icon} />
                    }
                    <div>
                        <p className={styles.track_title}>{active.title}</p>
                        <p className={styles.track_artist}>
                            {active.artist}
                            {active.subtitle && <span className={styles.track_playlist}> · {active.subtitle}</span>}
                        </p>
                    </div>
                </div>

                <div className={styles.controls}>
                    <button onClick={active.onPrev} className={styles.ctrl_btn}><HiBackward size={20} /></button>
                    <button onClick={active.onToggle} className={styles.play_btn}>
                        {active.playing ? <HiPause size={22} /> : <HiPlay size={22} />}
                    </button>
                    <button onClick={active.onNext} className={styles.ctrl_btn}><HiForward size={20} /></button>
                </div>

                <div className={styles.progress_section}>
                    <span className={styles.time}>{fmt(active.currentTime)}</span>
                    <input
                        type="range"
                        className={styles.progress}
                        min={0}
                        max={active.duration || 1}
                        step={0.1}
                        value={active.currentTime}
                        onChange={e => active.onSeek(Number(e.target.value))}
                    />
                    <span className={styles.time}>{fmt(active.duration)}</span>
                </div>

                <button
                    onClick={handleLyrics}
                    className={`${styles.lyrics_btn} ${showLyrics ? styles.lyrics_btn_active : ''}`}
                    title="Lyrics"
                >
                    <HiMenuAlt2 size={20} />
                </button>
            </div>
        </>
    );
}
