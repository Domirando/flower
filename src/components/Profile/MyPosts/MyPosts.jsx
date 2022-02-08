import './MyPosts.css'
import Post from './Post/Post'

const MyPosts = ({ posts }) => {
	// let posts = [
	// 	{id: 1, title: 'Organizator?!, Web Hackathon', likesCount: 5, dislikesCount: 0},
	// 	{id: 2, title: 'Hello!, Global Digits!!!',  likesCount: 8, dislikesCount: 1},
	// 	{id: 3, title: 'Hello!, Digital Panda!!!',  likesCount: 16, dislikesCount: 0},
	// 	{id: 4, title: 'Hello!, Digital Panda!!!',  likesCount: 16, dislikesCount: 0},
	// ]

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