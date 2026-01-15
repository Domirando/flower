import React, { useState, useEffect } from "react";
import Post from "./Post/Post";
import { supabase } from "../../../helper/supabaseClient";

const MyPosts = ({ telegramUser }) => {
	const [posts, setPosts] = useState([]);
	const [newPostText, setNewPostText] = useState("");
	const [loading, setLoading] = useState(false);

	// Fetch posts from Supabase
	const fetchPosts = async () => {
		const { data, error } = await supabase
			.from("posts")
			.select("*, users(username)")
			.order("created_at", { ascending: false });

		if (error) {
			console.error(error);
			return;
		}
		setPosts(data);
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	const addPost = async () => {
		if (!telegramUser) {
			alert("Please log in via Telegram first!");
			return;
		}
		if (!newPostText.trim()) return;

		setLoading(true);
		try {
			const res = await fetch("https://flower-backend-six.vercel.app/api/post", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ telegramUser, content: newPostText })
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to post");

			setNewPostText("");
			fetchPosts();
		} catch (err) {
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

			<div className="posts">
				{posts.map((post) => (
					<Post key={post.id} title={post.content} likeCount={0} dislikeCount={0} />
				))}
			</div>
		</div>
	);
};

export default MyPosts;
