import { useMusicPlayer } from '../../context/MusicPlayerContext';
import styles from './MusicPlayer.module.css';
import { HiPlay, HiPause, HiMusicNote } from 'react-icons/hi';
import { HiBackward, HiForward } from 'react-icons/hi2';

function fmt(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function MusicPlayer() {
    const {
        currentTrack, isPlaying, currentTime, duration,
        togglePlay, seek, playNext, playPrev,
        spotifyState,
    } = useMusicPlayer();

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
            artist: currentTrack.artist || 'Unknown artist',
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

    if (!active) return null;

    return (
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
        </div>
    );
}
