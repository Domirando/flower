import { useState } from 'react';
import styles from './Settings.module.css';
import { supabase } from "../../helper/supabaseClient";
import { clearUser, setUser } from "../../redux/state";

const Settings = ({user}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        } else {
            clearUser();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            // Create a local preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setEditForm(prev => ({ ...prev, avatar_url: event.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async (file) => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser || !file) return null;

        const fileExt = file.name.split(".").pop();
        const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type
            });

        if (error) {
            throw error;
        }

        const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let avatarUrl = user.avatar_url;
            if (avatarFile) {
                avatarUrl = await uploadAvatar(avatarFile);
            }

            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: editForm.full_name,
                    bio: editForm.bio,
                    avatar_url: avatarUrl
                }
            });

            if (error) throw error;

            setUser(data.user);
            setIsEditing(false);
            setAvatarFile(null);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error.message);
            alert("Failed to update profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.settings_wrapper}>
            <h1>Settings</h1>
            <div className={styles.user_info}>
                <div className={styles.avatar_container}>
                    <img src={isEditing ? editForm.avatar_url : user.avatar_url} alt="Profile" className={styles.avatar} />
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
                            <div>
                                <strong>Name:</strong> {user.full_name}
                            </div>
                            <div>
                                <strong>Biography:</strong> {user.bio}
                            </div>
                        </>
                    )}
                    <div>
                        <strong>Email:</strong> {user.email}
                    </div>
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
