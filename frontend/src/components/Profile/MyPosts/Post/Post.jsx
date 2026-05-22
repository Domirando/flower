import React, { useState } from 'react';
import { Edit, Delete, Save, Cancel } from '@material-ui/icons';
import styles from './Post.module.css';

const DEFAULT_AVATAR =
    "https://static.vecteezy.com/system/resources/previews/002/608/327/non_2x/mobile-application-avatar-web-button-menu-digital-silhouette-style-icon-free-vector.jpg";

const Post = ({ id, title, author, authorAvatar, isOwner, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(title);

    const handleSave = () => {
        onUpdate(id, editContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditContent(title);
        setIsEditing(false);
    };

    return (
        <div className={styles.post_card}>
            <div className={styles.post_main}>
                <div className={styles.author_info}>
                    <img
                        src={authorAvatar || DEFAULT_AVATAR}
                        alt=""
                        className={styles.avatar}
                    />
                    <div className={styles.author_details}>
                        <span className={styles.author_name}>{author}</span>
                        <span className={styles.posted_on}>Posted to Telegram</span>
                    </div>
                </div>

                <div className={styles.content_area}>
                    {isEditing ? (
                        <div className={styles.edit_container}>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className={styles.edit_textarea}
                                rows={4}
                            />
                            <div className={styles.edit_actions}>
                                <button onClick={handleSave} className={styles.save_btn} title="Save">
                                    <Save fontSize="small" /> Save Changes
                                </button>
                                <button onClick={handleCancel} className={styles.cancel_btn} title="Cancel">
                                    <Cancel fontSize="small" /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className={styles.post_content}>{title}</p>
                            {isOwner && (
                                <div className={styles.post_footer}>
                                    <div className={styles.owner_actions}>
                                        <button onClick={() => setIsEditing(true)} className={styles.edit_btn} title="Edit">
                                            <Edit fontSize="small" /> Edit
                                        </button>
                                        <button onClick={() => onDelete(id)} className={styles.delete_btn} title="Delete">
                                            <Delete fontSize="small" /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Post;
