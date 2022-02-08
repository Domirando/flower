import {ThumbDown, ThumbUp} from '@material-ui/icons';
import styles from './Post.module.css'

const Post = ({ title, description, likeCount, dislikeCount }) => {
    return (
        <div  className={styles.post}>
            <img src='https://png.pngtree.com/png-clipart/20190516/original/pngtree-cute-girl-avatar-material-png-image_4023832.jpg' alt='' />
            <div className="post_text">
                <h2>{ title }</h2>
                <h5>{ description }</h5>
                <div className={styles.grading_content}>
                    <span className={styles.grading}>
                        <ThumbUp className={styles.isLiked}/>
                        <p className='grading_counter'>{likeCount}</p>
                    </span>
                    <span className={styles.grading}>
                        <ThumbDown className={styles.isLiked}/>
                        <p className='grading_counter'>{dislikeCount}</p>
                    </span>
                </div>
            </div>
        </div>
    )
}
export default Post