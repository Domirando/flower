import '../styles/Profile.css'
const Profile = () => {
	return (
		<div className="content bg-blue-400">
            <img src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=874&q=80' alt=''/>
            <div className="content-main">
                <div className="content-main-card">
                    <img src='https://www.collinsdictionary.com/images/full/dog_230497594.jpg'/>
                    <div className="card-text">
                        <div>ava+description</div>
                        <div>my posts</div>
                        <div>new posts</div>
                        <div>
                            <div>post 1</div>
                            <div>post 2</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
	)
}
export default Profile;
