import { createContext, useContext, useState, useRef, useEffect } from 'react';

const MusicPlayerContext = createContext(null);

export function MusicPlayerProvider({ children }) {
    const [tracks, setTracks] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio());

    const audio = audioRef.current;

    useEffect(() => {
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDurationChange = () => setDuration(audio.duration || 0);
        const onEnded = () => {
            setCurrentIndex(prev => {
                if (prev === null || tracks.length === 0) return null;
                const next = (prev + 1) % tracks.length;
                return next;
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
    }, [tracks]);

    useEffect(() => {
        if (currentIndex === null || !tracks[currentIndex]) return;
        audio.src = tracks[currentIndex].file_url;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }, [currentIndex]);

    const playTrack = (index) => {
        if (index === currentIndex) {
            togglePlay();
        } else {
            setCurrentIndex(index);
        }
    };

    const togglePlay = () => {
        if (audio.paused) {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const seek = (time) => {
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const playNext = () => {
        if (tracks.length === 0) return;
        setCurrentIndex(prev => prev === null ? 0 : (prev + 1) % tracks.length);
    };

    const playPrev = () => {
        if (tracks.length === 0) return;
        setCurrentIndex(prev => prev === null ? 0 : (prev - 1 + tracks.length) % tracks.length);
    };

    return (
        <MusicPlayerContext.Provider value={{
            tracks, setTracks,
            currentIndex, isPlaying,
            currentTime, duration,
            playTrack, togglePlay, seek, playNext, playPrev,
            currentTrack: currentIndex !== null ? tracks[currentIndex] : null,
        }}>
            {children}
        </MusicPlayerContext.Provider>
    );
}

export const useMusicPlayer = () => useContext(MusicPlayerContext);
