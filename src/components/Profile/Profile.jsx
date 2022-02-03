import styles from './Profile.module.css'

const Profile = () => {
    return (
        <div className={styles.content}>
            <img src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=874&q=80' alt=''/>
            <div>
                <div className={styles.content_main_card}>
                    <img src='https://www.collinsdictionary.com/images/full/dog_230497594.jpg'/>
                    <div className={styles.content_text}>
                        <div>ava+description</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Profile;