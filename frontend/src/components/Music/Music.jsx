import styles from './Music.module.css';

export default function Music() {
    return (
        <div className={styles.auth_container}>
            <h1>Music</h1>
            <p>
                Spotify integration is coming soon. The platform has moved away from Supabase
                and a standalone OAuth flow is being implemented.
            </p>
        </div>
    );
}
