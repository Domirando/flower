import {ThumbDown, ThumbUp} from '@material-ui/icons';
import styles from './Post.module.css'
import state from "../../../../redux/state";

const Post = ({ title, description, likeCount, dislikeCount }) => {
    return (
        <div  className={styles.post}>
            <img src={state.profilePage.user.avatar_url} alt='' />
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