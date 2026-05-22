import React, { useEffect, useState } from "react";
import Post from "./Post/Post";
import { api, getToken } from "../../../api/client";
import { jwtDecode } from "../../../api/jwtDecode";
import styles from "../Profile.module.css";

const MyPosts = () => {
    const [posts, setPosts] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const payload = jwtDecode(token);
                setCurrentUserId(payload.sub);
            } catch {
                // malformed token, ignore
            }
        }

        api.getPosts()
            .then(({ posts }) => setPosts(posts))
            .catch(console.error);
    }, []);

    const deletePost = async (id) => {
        try {
            await api.deletePost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const updatePost = async (id, content) => {
        try {
            await api.updatePost(id, content);
            setPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className={styles.main_content}>
            {posts.map((post) => (
                <Post
                    key={post.id}
                    id={post.id}
                    title={post.content}
                    author={post.author_name || "Anonymous"}
                    authorAvatar={post.author_avatar}
                    isOwner={currentUserId && post.user_id === currentUserId}
                    onDelete={deletePost}
                    onUpdate={updatePost}
                />
            ))}
        </div>
    );
};

export default MyPosts;
