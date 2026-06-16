import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const MusicPlayerContext = createContext(null);

export function MusicPlayerProvider({ children }) {
    const [tracks, setTracks] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio());
    const tracksRef = useRef(tracks);

    useEffect(() => {
        tracksRef.current = tracks;
    }, [tracks]);

    useEffect(() => {
        const audio = audioRef.current;
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDurationChange = () => setDuration(audio.duration || 0);
        const onEnded = () => {
            setCurrentIndex(prev => {
                const list = tracksRef.current;
                if (prev === null || list.length === 0) return null;
                return (prev + 1) % list.length;
            });
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('durationchange', onDurationChange);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('durationchange', onDurationChange);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (currentIndex === null || !tracksRef.current[currentIndex]) return;
        audio.src = tracksRef.current[currentIndex].file_url;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }, [currentIndex]);

    const playTrack = useCallback((index) => {
        // Clear Spotify from the bar so own-song takes over
        setSpotifyState(null);
        if (index === currentIndex) {
            const audio = audioRef.current;
            if (audio.paused) {
                audio.play().then(() => setIsPlaying(true)).catch(() => {});
            } else {
                audio.pause();
                setIsPlaying(false);
            }
        } else {
            setCurrentIndex(index);
        }
    }, [currentIndex]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (audio.paused) {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    }, []);

    const seek = useCallback((time) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    const playNext = useCallback(() => {
        setCurrentIndex(prev => {
            const list = tracksRef.current;
            if (list.length === 0) return prev;
            return prev === null ? 0 : (prev + 1) % list.length;
        });
    }, []);

    const playPrev = useCallback(() => {
        setCurrentIndex(prev => {
            const list = tracksRef.current;
            if (list.length === 0) return prev;
            return prev === null ? 0 : (prev - 1 + list.length) % list.length;
        });
    }, []);

    const pauseOwn = useCallback(() => {
        const audio = audioRef.current;
        audio.pause();
        setIsPlaying(false);
        setCurrentIndex(null);
    }, []);

    // ── Spotify bridge ────────────────────────────────────────────────────────
    // Music.jsx calls setSpotifyState({ track, isPaused, position, duration, controls })
    // Setting null clears Spotify from the bar.
    const [spotifyState, setSpotifyState] = useState(null);

    return (
        <MusicPlayerContext.Provider value={{
            tracks, setTracks,
            currentIndex, isPlaying,
            currentTime, duration,
            playTrack, togglePlay, seek, playNext, playPrev, pauseOwn,
            currentTrack: currentIndex !== null ? tracks[currentIndex] : null,
            spotifyState, setSpotifyState,
        }}>
            {children}
        </MusicPlayerContext.Provider>
    );
}

export const useMusicPlayer = () => useContext(MusicPlayerContext);
