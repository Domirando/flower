import './MyPosts.css'
import Post from './Post/Post'
import React from "react";

const MyPosts = ({ posts }) => {
	let newPostElement = React.createRef()
	let addPost = () => {
		let text = newPostElement.current.value;
		alert(text)
	}
	return (
		<div className='my_posts'>
			<h4>My posts</h4>
			<div className='new_posts'>
				<textarea ref={newPostElement} />
				<button onClick={ addPost }>Add post</button>
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