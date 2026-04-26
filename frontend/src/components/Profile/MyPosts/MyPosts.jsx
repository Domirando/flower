import React, { useEffect, useState } from "react";
import Post from "./Post/Post";
import { supabase } from "../../../helper/supabaseClient";
import styles from "../Profile.module.css";

const MyPosts = () => {
	const [posts, setPosts] = useState([]);
	const [user, setUser] = useState(null);

	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user || null);
		};
		getUser();
	}, []);

	console.log(user)

	const fetchPosts = async () => {
		const { data, error } = await supabase
			.from("posts")
			.select("*, users(full_name)")
			.order("created_at", { ascending: false });

		if (!error) setPosts(data);
	};

	const deletePost = async (id) => {
		const { error } = await supabase
			.from("posts")
			.delete()
			.eq("id", id);

		if (error) {
			alert(error.message);
		} else {
			setPosts(posts.filter(p => p.id !== id));
		}
	};

	const updatePost = async (id, content) => {
		const { error } = await supabase
			.from("posts")
			.update({ content })
			.eq("id", id);

		if (error) {
			alert(error.message);
		} else {
			setPosts(posts.map(p => p.id === id ? { ...p, content } : p));
		}
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	return (
		<div className={styles.main_content}>
			{posts.map((post) => (
				<Post
					key={post.id}
					id={post.id}
					title={post.content}
					author={post.users?.full_name || "Anonymous"}
					isOwner={user && post.user_id === user.id}
					onDelete={deletePost}
					onUpdate={updatePost}
				/>
			))}
		</div>
	);
};

export default MyPosts;
