import React, { useState } from "react";
import { api } from "../../api/client";
import styles from "./NewPost.module.css";

export default function NewPost() {
    const [newPostText, setNewPostText] = useState("");
    const [loading, setLoading] = useState(false);

    const addPost = async () => {
        if (!newPostText.trim()) return;

        setLoading(true);
        try {
            await api.createPost(newPostText.trim());
            setNewPostText("");
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>New Post</h1>
            <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Write your post…"
                disabled={loading}
                className={styles.textarea}
            />
            <button onClick={addPost} disabled={loading}>
                {loading ? "Posting..." : "Post"}
            </button>
        </div>
    );
}
