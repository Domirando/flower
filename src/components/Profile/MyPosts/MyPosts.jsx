import './MyPosts.css'
import Post from './Post/Post'
import React from "react";

const MyPosts = ({ posts, addPost }) => {
	let newPostElement = React.createRef()
	let addPosts = (e) => {
		let text = newPostElement.current.value;
		addPost(text);

	}
	return (
		<div className='my_posts'>
			<h4>My posts</h4>
			<div className='new_posts'>
				<textarea ref={newPostElement} />
				<button onClick={ addPosts }>Add post</button>
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