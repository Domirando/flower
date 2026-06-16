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

function fmtMs(ms) {
    return fmt(ms / 1000);
}

export default function MusicPlayer() {
    const {
        currentTrack, isPlaying, currentTime, duration,
        togglePlay, seek, playNext, playPrev,
        spotifyState,
    } = useMusicPlayer();

    // Spotify takes priority when a track is active there
    if (spotifyState?.track) {
        const { track, isPaused, position, duration: spDuration, controls } = spotifyState;
        const artists = track.artists?.map(a => a.name).join(', ') || '';
        const thumb = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url;
        const pct = spDuration > 0 ? Math.min((position / spDuration) * 100, 100) : 0;

        return (
            <div className={styles.player}>
                <div className={styles.track_info}>
                    {thumb
                        ? <img src={thumb} alt="" className={styles.thumb} />
                        : <HiMusicNote size={20} className={styles.note_icon} />
                    }
                    <div>
                        <p className={styles.track_title}>{track.name}</p>
                        <p className={styles.track_artist}>{artists}</p>
                    </div>
                </div>

                <div className={styles.controls}>
                    <button onClick={controls.prev} className={styles.ctrl_btn}><HiBackward size={20} /></button>
                    <button onClick={controls.toggle} className={styles.play_btn}>
                        {isPaused ? <HiPlay size={22} /> : <HiPause size={22} />}
                    </button>
                    <button onClick={controls.next} className={styles.ctrl_btn}><HiForward size={20} /></button>
                </div>

                <div className={styles.progress_section}>
                    <span className={styles.time}>{fmtMs(position)}</span>
                    <div className={styles.progress_bar}>
                        <div className={styles.progress_fill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.time}>{fmtMs(spDuration)}</span>
                </div>
            </div>
        );
    }

    if (!currentTrack) return null;

    return (
        <div className={styles.player}>
            <div className={styles.track_info}>
                <HiMusicNote size={20} className={styles.note_icon} />
                <div>
                    <p className={styles.track_title}>{currentTrack.title}</p>
                    <p className={styles.track_artist}>{currentTrack.artist || 'Unknown artist'}</p>
                </div>
            </div>

            <div className={styles.controls}>
                <button onClick={playPrev} className={styles.ctrl_btn}><HiBackward size={20} /></button>
                <button onClick={togglePlay} className={styles.play_btn}>
                    {isPlaying ? <HiPause size={22} /> : <HiPlay size={22} />}
                </button>
                <button onClick={playNext} className={styles.ctrl_btn}><HiForward size={20} /></button>
            </div>

            <div className={styles.progress_section}>
                <span className={styles.time}>{fmt(currentTime)}</span>
                <input
                    type="range"
                    className={styles.progress}
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    onChange={e => seek(Number(e.target.value))}
                />
                <span className={styles.time}>{fmt(duration)}</span>
            </div>
        </div>
    );
}
