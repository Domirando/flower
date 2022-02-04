import './MyPosts.css'
import Post from './Post/Post'

const MyPosts = () => {
	return (
		<div className='my_posts'>
			<h4>My posts</h4>
			<div className='new_posts'>
				<textarea />
				<button>Add post</button>
			</div>
			<div className='posts'>
				<Post title='Web Hackathon' description='some descriptions...'/>
				<Post title='Global Digits' description='some descriptions....'/>
				<Post title='Digital Panda' description='some descriptions....'/>
			</div>
		</div>
	)
}
export default MyPosts;