import React, { useEffect, useState } from "react";
import Post from "./Post/Post";
import { supabase } from "../../../helper/supabaseClient";

const MyPosts = () => {
	const [posts, setPosts] = useState([]);
	const [user, setUser] = useState(null);

	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			console.log(user.id);
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

	useEffect(() => {
		fetchPosts();
	}, []);

	return (
		<div>
			{posts.map((post) => (
				<Post
					key={post.id}
					title={post.content}
					author={post.users?.full_name || "Anonymous"}
				/>
			))}
		</div>
	);
};

export default MyPosts;
