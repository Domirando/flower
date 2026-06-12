import { useEffect, useState } from 'react';
import { supabase } from "../../helper/supabaseClient";
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import styles from './Music.module.css';
import { HiPlay, HiPause, HiUpload, HiMusicNote, HiTrash } from 'react-icons/hi';

export default function Music() {
    const [activeTab, setActiveTab] = useState('tracks');
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [uploadForm, setUploadForm] = useState({ title: '', artist: '', file: null });
    const [uploading, setUploading] = useState(false);

    const { playTrack, setTracks: setPlayerTracks, currentIndex, isPlaying } = useMusicPlayer();

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('music')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            const list = data || [];
            setTracks(list);
            setPlayerTracks(list);
        } catch (err) {
            console.error('Error fetching tracks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const { title, artist, file } = uploadForm;
        if (!title || !file) {
            alert('Please provide a title and audio file');
            return;
        }

        setUploading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData.user;
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `tracks/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('music')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('music')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase.from('music').insert({
                user_id: user.id,
                title,
                artist,
                file_url: publicUrl,
                file_path: filePath,
            });
            if (dbError) throw dbError;

            setUploadForm({ title: '', artist: '', file: null });
            setActiveTab('tracks');
            await fetchTracks();
        } catch (err) {
            console.error('Upload error:', err);
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (track) => {
        if (!window.confirm(`Delete "${track.title}"?`)) return;
        setDeleting(track.id);
        try {
            if (track.file_path) {
                await supabase.storage.from('music').remove([track.file_path]);
            }
            const { error } = await supabase.from('music').delete().eq('id', track.id);
            if (error) throw error;
            const updated = tracks.filter(t => t.id !== track.id);
            setTracks(updated);
            setPlayerTracks(updated);
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Music</h1>
            </header>

            <div className={styles.tabs}>
                <div
                    className={`${styles.tab} ${activeTab === 'tracks' ? styles.active_tab : ''}`}
                    onClick={() => setActiveTab('tracks')}
                >
                    <HiMusicNote size={16} /> My Tracks
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'upload' ? styles.active_tab : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <HiUpload size={16} /> Upload
                </div>
            </div>

            {activeTab === 'tracks' && (
                <div className={styles.tracks_list}>
                    {loading ? (
                        <div className={styles.loader}>Loading tracks...</div>
                    ) : tracks.length === 0 ? (
                        <div className={styles.empty}>No tracks yet. Upload some music!</div>
                    ) : (
                        tracks.map((track, index) => {
                            const active = currentIndex === index;
                            return (
                                <div key={track.id} className={`${styles.track_item} ${active ? styles.track_active : ''}`}>
                                    <button
                                        className={styles.play_btn}
                                        onClick={() => playTrack(index)}
                                    >
                                        {active && isPlaying ? <HiPause size={18} /> : <HiPlay size={18} />}
                                    </button>
                                    <div className={styles.track_info}>
                                        <p className={styles.track_title}>{track.title}</p>
                                        <p className={styles.track_artist}>{track.artist || 'Unknown artist'}</p>
                                    </div>
                                    <button
                                        className={styles.delete_btn}
                                        onClick={() => handleDelete(track)}
                                        disabled={deleting === track.id}
                                    >
                                        <HiTrash size={16} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'upload' && (
                <div className={styles.upload_section}>
                    <h2>Upload a Track</h2>
                    <form onSubmit={handleUpload}>
                        <div className={styles.form_group}>
                            <label className={styles.label}>Title *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={uploadForm.title}
                                onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label className={styles.label}>Artist</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={uploadForm.artist}
                                onChange={e => setUploadForm({ ...uploadForm, artist: e.target.value })}
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label className={styles.label}>Audio File (MP3, WAV, etc.) *</label>
                            <input
                                type="file"
                                accept="audio/*"
                                className={styles.input}
                                onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.upload_btn} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload Track'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
