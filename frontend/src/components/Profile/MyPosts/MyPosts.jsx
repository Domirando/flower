import React, { useEffect, useState } from "react";
import Post from "./Post/Post";
import { supabase } from "../../../helper/supabaseClient";

const MyPosts = () => {
	const [posts, setPosts] = useState([]);
	const [newPostText, setNewPostText] = useState("");
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			console.log(user.id);
			setUser(user || null);
		};
		getUser();
	}, []);

	const fetchPosts = async () => {
		const { data, error } = await supabase
			.from("posts")
			.select("*, users(full_name)")
			.order("created_at", { ascending: false });

		if (!error) setPosts(data);
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	const addPost = async () => {
		if (!user) {
			alert("Please log in first");
			return;
		}
		if (!newPostText.trim()) return;

		setLoading(true);

		try {
			const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/post-to-telegram`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					text: newPostText
				})
			});

			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Server error: ${text}`);
			}

			const data = await res.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to post");
			}

			setNewPostText("");
			fetchPosts();
		} catch (err) {
			console.error(err);
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
      <textarea
		  value={newPostText}
		  onChange={(e) => setNewPostText(e.target.value)}
		  placeholder="Write your post…"
		  disabled={loading}
	  />

			<button onClick={addPost} disabled={loading}>
				{loading ? "Posting..." : "Post"}
			</button>

			<div>
				{posts.map((post) => (
					<Post
						key={post.id}
						title={post.content}
						author={post.users?.full_name || "Anonymous"}
					/>
				))}
			</div>
		</div>
	);
};

export default MyPosts;
