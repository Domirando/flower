import './MyPosts.css'
import Post from './Post/Post'

const MyPosts = ({ posts }) => {
	return (
		<div className='my_posts'>
			<h4>My posts</h4>
			<div className='new_posts'>
				<textarea />
				<button>Add post</button>
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