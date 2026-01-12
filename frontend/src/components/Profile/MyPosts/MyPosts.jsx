import './MyPosts.css'
import Post from './Post/Post'
import React, {useState} from "react";

const MyPosts = ({ posts, addPost, newPostText, updateNewPosText }) => {
	let newPostElement = React.createRef()
	let addPosts = (e) => {
		let text = newPostElement.current.value;
		addPost();
	}
	let onPostChange = () => {
		let text = newPostElement.current.value;
		updateNewPosText(text)
		console.log(text)
	}

	const [text, setText] = useState("");

	const postToTelegram = async () => {
		const res = await fetch("/api/post-to-telegram", {
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
		<div className='my_posts'>
			<h4>My posts</h4>
			<div className='new_posts'>
				<textarea ref={newPostElement} onChange={ onPostChange } value={newPostText} />
				<button onClick={ addPosts }>Add post</button>
			</div>
			<div>
      <textarea
		  value={text}
		  onChange={(e) => setText(e.target.value)}
		  placeholder="Write your post…"
	  />
				<button onClick={postToTelegram}>
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