import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import styles from './News.module.css';

const News = ({ user }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [interests, setInterests] = useState(null); // null = not yet known
    const prevInterestsRef = useRef(undefined);

    // Resolve interests: prefer prop, fall back to API
    useEffect(() => {
        if (user?.interests !== undefined) {
            setInterests(user.interests);
        } else {
            api.getMe()
                .then(u => setInterests(u.interests || []))
                .catch(() => setInterests([]));
        }
    }, [user?.interests]);

    // Fetch news whenever interests are known
    useEffect(() => {
        if (interests === null) return; // still loading interests

        // Skip if interests haven't actually changed
        const key = (interests || []).slice().sort().join(',');
        if (key === prevInterestsRef.current) return;
        prevInterestsRef.current = key;

        setLoading(true);
        setError(null);
        const interestParam = interests.length > 0 ? interests.join(',') : undefined;
        api.getNews(interestParam)
            .then(data => setNews(data.items || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [interests]);

    if (loading) return <div className={styles.loader}>Loading the latest news...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <header className={styles.news_header}>
                <h1>BBC News</h1>
                {interests && interests.length > 0 && (
                    <p className={styles.personalized_tag}>
                        Filtered by: {interests.join(', ')}
                    </p>
                )}
            </header>

            {news.length === 0 ? (
                <p className={styles.no_results}>
                    {interests && interests.length > 0
                        ? `No articles found matching "${interests.join(', ')}". Try broader interests in Settings.`
                        : 'No news articles available.'}
                </p>
            ) : (
                <div className={styles.news_grid}>
                    {news.map((item, index) => (
                        <article key={index} className={styles.card}>
                            {item.thumbnail && (
                                <div className={styles.thumbnail_container}>
                                    <img src={item.thumbnail} alt={item.title} className={styles.thumbnail} />
                                </div>
                            )}
                            <div className={styles.content}>
                                <h2 className={styles.title}>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                        {item.title}
                                    </a>
                                </h2>
                                <p className={styles.snippet}>{item.snippet}</p>
                                <div className={styles.footer}>
                                    <span className={styles.date}>{new Date(item.pubDate).toLocaleDateString()}</span>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.read_more}>
                                        Read more
                                    </a>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default News;
