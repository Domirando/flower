import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../../api/client';
import { clearUser, setUser } from '../../redux/state';
import styles from './Settings.module.css';

const Settings = ({ user }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        clearToken();
        clearUser();
        navigate('/login');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (event) =>
            setEditForm(prev => ({ ...prev, avatar_url: event.target.result }));
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let updatedUser = await api.updateMe({
                full_name: editForm.full_name,
                bio: editForm.bio
            });

            if (avatarFile) {
                const formData = new FormData();
                formData.append("file", avatarFile);
                const { avatar_url } = await api.uploadAvatar(formData);
                updatedUser = { ...updatedUser, avatar_url };
            }

            setUser(updatedUser);
            setIsEditing(false);
            setAvatarFile(null);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.settings_wrapper}>
            <h1>Settings</h1>
            <div className={styles.user_info}>
                <div className={styles.avatar_container}>
                    <img
                        src={isEditing ? editForm.avatar_url : user.avatar_url}
                        alt="Profile"
                        className={styles.avatar}
                    />
                    {isEditing && (
                        <div className={styles.file_input_container}>
                            <label htmlFor="avatar-upload" className={styles.file_label}>
                                Change Photo
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className={styles.file_input}
                            />
                        </div>
                    )}
                </div>
                <div className={styles.details}>
                    {isEditing ? (
                        <>
                            <div className={styles.input_group}>
                                <label>Name:</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.input_group}>
                                <label>Biography:</label>
                                <textarea
                                    name="bio"
                                    value={editForm.bio}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div><strong>Name:</strong> {user.full_name}</div>
                            <div><strong>Biography:</strong> {user.bio}</div>
                        </>
                    )}
                    <div><strong>Email:</strong> {user.email}</div>
                </div>
            </div>
            <div className={styles.actions}>
                {isEditing ? (
                    <>
                        <button
                            className={styles.save_btn}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            className={styles.cancel_btn}
                            onClick={() => {
                                setIsEditing(false);
                                setAvatarFile(null);
                                setEditForm({
                                    full_name: user.full_name,
                                    bio: user.bio,
                                    avatar_url: user.avatar_url
                                });
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button className={styles.edit_btn} onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                )}
                <button className={styles.logout_btn} onClick={handleLogout}>
                    Log out
                </button>
            </div>
        </div>
    );
};

export default Settings;
