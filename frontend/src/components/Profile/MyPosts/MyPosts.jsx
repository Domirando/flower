import './MyPosts.css'
import Post from './Post/Post'
import React, {useState} from "react";

const MyPosts = ({ posts, addPost, newPostText, updateNewPosText }) => {
	const [text, setText] = useState("");

	let onPostChange = (text) => {
		setText(text.target.value)
		updateNewPosText(text.target.value)
		console.log(text.target.value)
	}

	const addPosts = async () => {
		addPost();

		const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/post-to-telegram`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
		});

		if (!res.ok) {
			alert("Failed to post");
		} else {
			alert("Posted to Telegram ✅");
		}

	};

	return (
		<div>
			<div className='my_posts'>
				<h4>My posts</h4>
				<textarea
					value={newPostText}
					onChange={(e) => onPostChange(e)}
					placeholder="Write your post…"
				/>
				<button onClick={addPosts}>
				Post
			</button>
			</div>

			<div className='posts'>
				{posts.map(post =>
					<Post title={post.title}
						  likeCount={post.likesCount}
						  dislikeCount={post.dislikesCount}/>
				)}
			</div>
		</div>
	)
}
export default MyPosts;