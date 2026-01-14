import './MyPosts.css'
import Post from './Post/Post'
import React, {useState} from "react";

const MyPosts = ({ posts, addPost, newPostText, updateNewPosText }) => {
	const [text, setText] = useState("");

	let newPostElement = React.createRef()
	let onPostChange = () => {
		let text = newPostElement.current.value;
		updateNewPosText(text)
		console.log(text)
	}

	const addPosts = async () => {
		const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/post-to-telegram`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
		});

		if (!res.ok) {
			alert("Failed to post");
		} else {
			addPost();
			alert("Posted to Telegram ✅");
		}

	};

	return (
		<div>
			<div className='my_posts'>
				<h4>My posts</h4>
				<div className='new_posts'>
					<textarea ref={newPostElement} onChange={ onPostChange } value={newPostText} />
					<button onClick={ addPosts }>Post</button>
				</div>
			</div>

			<div>
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Write your post…"
				/>
				<button onClick={addPosts}>
				Post to Telegram
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