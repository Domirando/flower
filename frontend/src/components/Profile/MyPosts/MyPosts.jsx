import React, { useEffect, useState } from "react";
import Post from "./Post/Post";
import { api, getToken } from "../../../api/client";
import { jwtDecode } from "../../../api/jwtDecode";
import styles from "../Profile.module.css";

const MyPosts = () => {
    const [posts, setPosts] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [channelNameMap, setChannelNameMap] = useState({});

    useEffect(() => {
        let userId = null;
        const token = getToken();
        if (token) {
            try {
                const payload = jwtDecode(token);
                userId = payload.sub;
                setCurrentUserId(userId);
            } catch {
                // malformed token, ignore
            }
        }

        api.getMe().then(user => {
            const ids = user.telegram_channels || [];
            const names = user.telegram_channel_names || [];
            const map = {};
            ids.forEach((id, i) => { if (names[i]) map[id] = names[i]; });
            setChannelNameMap(map);
        }).catch(() => {});

        api.getPosts()
            .then(({ posts }) => {
                setPosts(userId ? posts.filter(p => p.user_id === userId) : posts);
            })
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
            {posts.length === 0 && (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No posts yet.
                </p>
            )}
            {posts.map((post) => (
                <Post
                    key={post.id}
                    id={post.id}
                    title={post.content}
                    author={post.author_name || "Anonymous"}
                    authorAvatar={post.author_avatar}
                    isOwner={currentUserId && post.user_id === currentUserId}
                    channels={post.telegram_channels || []}
                    channelNameMap={channelNameMap}
                    onDelete={deletePost}
                    onUpdate={updatePost}
                />
            ))}
        </div>
    );
};

export default MyPosts;
