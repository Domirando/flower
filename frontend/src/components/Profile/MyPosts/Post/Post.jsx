import React, { useState } from 'react';
import { ThumbDown, ThumbUp, Edit, Delete, Save, Cancel } from '@material-ui/icons';
import styles from './Post.module.css'
import state from "../../../../redux/state";

const Post = ({ id, title, description, likeCount, dislikeCount, isOwner, onDelete, onUpdate }) => {
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
        <div className={styles.post}>
            <img src={state.profilePage.user.avatar_url} alt='' />
            <div className={styles.post_text}>
                {isEditing ? (
                    <div className={styles.edit_container}>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={styles.edit_textarea}
                        />
                        <div className={styles.edit_actions}>
                            <button onClick={handleSave} title="Save"><Save /></button>
                            <button onClick={handleCancel} title="Cancel"><Cancel /></button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2>{title}</h2>
                        <h5>{description}</h5>
                        <div className={styles.grading_content}>
                            <span className={styles.grading}>
                                <ThumbUp className={styles.isLiked} />
                                <p className='grading_counter'>{likeCount}</p>
                            </span>
                            <span className={styles.grading}>
                                <ThumbDown className={styles.isLiked} />
                                <p className='grading_counter'>{dislikeCount}</p>
                            </span>
                            {isOwner && (
                                <div className={styles.owner_actions}>
                                    <button onClick={() => setIsEditing(true)} title="Edit"><Edit /></button>
                                    <button onClick={() => onDelete(id)} title="Delete"><Delete /></button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
export default Post