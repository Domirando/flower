import "./MyPosts.css";
import Post from "./Post/Post";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../helper/supabaseClient";

const MyPosts = () => {
	console.log("sup:", supabase)

	const [posts, setPosts] = useState([]);
	const [newPostText, setNewPostText] = useState("");
	const [loading, setLoading] = useState(false);

	/* 🔹 READ POSTS FROM SUPABASE */
	const fetchPosts = async () => {
		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Fetch posts error:", error);
			return;
		}

		setPosts(data);
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	/* 🔹 CREATE POST (Telegram + DB) */
	const addPosts = async () => {
		if (!newPostText.trim()) return;

		setLoading(true);

		try {
			const { data, error } = await supabase.auth.getSession();
			if (error || !data.session) {
				throw new Error("Not authenticated");
			}

			const token = data.session.access_token;

			const res = await fetch(
				`${process.env.REACT_APP_BACKEND_URL}/api/post-to-telegram`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ text: newPostText }),
				}
			);

			if (!res.ok) {
				throw new Error("Failed to post");
			}

			setNewPostText("");
			await fetchPosts(); // 🔥 refresh posts from DB
		} catch (err) {
			console.error(err);
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<div className="my_posts">
				<h4>My posts</h4>

				<textarea
					value={newPostText}
					onChange={(e) => setNewPostText(e.target.value)}
					placeholder="Write your post…"
					disabled={loading}
				/>

				<button onClick={addPosts} disabled={loading}>
					{loading ? "Posting..." : "Post"}
				</button>
			</div>

			<div className="posts">
				{posts.map((post) => (
					<Post
						key={post.id}
						title={post.content}
						likeCount={0}
						dislikeCount={0}
					/>
				))}
			</div>
		</div>
	);
};

export default MyPosts;
