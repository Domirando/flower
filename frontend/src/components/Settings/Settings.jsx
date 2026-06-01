import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../../api/client';
import { clearUser, setUser } from '../../redux/state';
import styles from './Settings.module.css';

export default function Settings({ user }) {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

    // ── Profile fields ──────────────────────────────────────────────────────
    const [fullName, setFullName] = useState(user.full_name || '');
    const [bio, setBio] = useState(user.bio || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || '');

    // ── Interests ───────────────────────────────────────────────────────────
    const [interests, setInterests] = useState(user.interests || []);
    const [interestInput, setInterestInput] = useState('');

    // ── Telegram channels ───────────────────────────────────────────────────
    const [channels, setChannels] = useState(user.telegram_channels || []);
    const [channelNames, setChannelNames] = useState(user.telegram_channel_names || []);
    const [newChannel, setNewChannel] = useState('');
    const [newChannelName, setNewChannelName] = useState('');
    const [resolvingChannel, setResolvingChannel] = useState(false);

    // Re-sync when parent user prop changes (e.g. after Redux update)
    useEffect(() => {
        setFullName(user.full_name || '');
        setBio(user.bio || '');
        setAvatarPreview(user.avatar_url || '');
        setInterests(user.interests || []);
        setChannels(user.telegram_channels || []);
        setChannelNames(user.telegram_channel_names || []);
    }, [user]);

    // ── Interest tag input ──────────────────────────────────────────────────
    const addInterest = () => {
        const val = interestInput.trim().toLowerCase();
        if (val && !interests.includes(val)) {
            setInterests(prev => [...prev, val]);
        }
        setInterestInput('');
    };

    const onInterestKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addInterest();
        }
    };

    const removeInterest = (idx) => {
        setInterests(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Channel management ──────────────────────────────────────────────────
    const resolveNewChannel = async () => {
        const id = newChannel.trim();
        if (!id) return;
        setResolvingChannel(true);
        try {
            const { name } = await api.resolveTelegramChannel(id);
            setNewChannelName(name || id);
        } catch {
            setNewChannelName(id);
        } finally {
            setResolvingChannel(false);
        }
    };

    const addChannel = () => {
        const id = newChannel.trim();
        if (!id || channels.includes(id)) return;
        setChannels(prev => [...prev, id]);
        setChannelNames(prev => [...prev, newChannelName || id]);
        setNewChannel('');
        setNewChannelName('');
    };

    const removeChannel = (idx) => {
        setChannels(prev => prev.filter((_, i) => i !== idx));
        setChannelNames(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Avatar ──────────────────────────────────────────────────────────────
    const onAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    // ── Save ────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            let updated = await api.updateMe({
                full_name: fullName,
                bio,
                interests,
                telegram_channels: channels,
            });

            if (avatarFile) {
                const fd = new FormData();
                fd.append('file', avatarFile);
                const { avatar_url } = await api.uploadAvatar(fd);
                updated = { ...updated, avatar_url };
                setAvatarFile(null);
            }

            setUser(updated);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        clearToken();
        clearUser();
        navigate('/login');
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.heading}>Settings</h1>

            {/* ── Profile ── */}
            <section className={styles.card}>
                <h2 className={styles.section_title}>Profile</h2>
                <div className={styles.avatar_row}>
                    <div className={styles.avatar_wrap}>
                        <img src={avatarPreview} alt="" className={styles.avatar} />
                        <label className={styles.avatar_btn}>
                            Change photo
                            <input type="file" accept="image/*" onChange={onAvatarChange} className={styles.hidden} />
                        </label>
                    </div>
                    <div className={styles.fields}>
                        <label className={styles.label}>
                            Name
                            <input
                                className={styles.input}
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </label>
                        <label className={styles.label}>
                            Bio
                            <textarea
                                className={styles.textarea}
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={3}
                            />
                        </label>
                        <div className={styles.label}>
                            Email
                            <span className={styles.readonly}>{user.email}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Interests ── */}
            <section className={styles.card}>
                <h2 className={styles.section_title}>News Interests</h2>
                <p className={styles.hint}>Topics used to filter your news feed. Press Enter or comma to add.</p>
                <div className={styles.tag_input_wrap}>
                    {interests.map((tag, i) => (
                        <span key={i} className={styles.tag}>
                            {tag}
                            <button className={styles.tag_remove} onClick={() => removeInterest(i)}>×</button>
                        </span>
                    ))}
                    <input
                        className={styles.tag_input}
                        value={interestInput}
                        onChange={e => setInterestInput(e.target.value)}
                        onKeyDown={onInterestKey}
                        onBlur={addInterest}
                        placeholder={interests.length === 0 ? 'e.g. technology, sport, business…' : ''}
                    />
                </div>
            </section>

            {/* ── Telegram Channels ── */}
            <section className={styles.card}>
                <h2 className={styles.section_title}>Telegram Channels</h2>
                <p className={styles.hint}>Channels your posts are sent to. Add your bot as admin first.</p>

                {channels.length > 0 ? (
                    <ul className={styles.channel_list}>
                        {channels.map((ch, i) => (
                            <li key={ch} className={styles.channel_item}>
                                <div className={styles.channel_info}>
                                    <span className={styles.channel_name}>{channelNames[i] || ch}</span>
                                    {channelNames[i] && channelNames[i] !== ch && (
                                        <span className={styles.channel_id}>{ch}</span>
                                    )}
                                </div>
                                <button className={styles.remove_btn} onClick={() => removeChannel(i)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.empty}>No channels connected.</p>
                )}

                <div className={styles.add_channel_row}>
                    <input
                        className={styles.input}
                        value={newChannel}
                        onChange={e => { setNewChannel(e.target.value); setNewChannelName(''); }}
                        onBlur={resolveNewChannel}
                        placeholder="Channel ID or @username"
                    />
                    {newChannelName && (
                        <span className={styles.resolved_name}>
                            {resolvingChannel ? 'Resolving…' : `✓ ${newChannelName}`}
                        </span>
                    )}
                    <button
                        className={styles.add_btn}
                        onClick={addChannel}
                        disabled={!newChannel.trim()}
                    >
                        Add
                    </button>
                </div>
            </section>

            {/* ── Actions ── */}
            <div className={styles.actions}>
                <button className={styles.save_btn} onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button className={styles.logout_btn} onClick={handleLogout}>Log out</button>
            </div>
        </div>
    );
}
