import React, { useEffect, useState } from 'react';
import styles from './News.module.css';

const News = ({ user }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const interestsParam = user?.interests?.length > 0 
                    ? `?interests=${encodeURIComponent(user.interests.join(','))}` 
                    : '';
                
                const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                const url = `${backendUrl}/api/news${interestsParam}`;
                console.log('Fetching news from:', url);
                const response = await fetch(url);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch news: ${response.status} ${errorText}`);
                }
                
                const data = await response.json();
                setNews(data.items || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [user?.interests]);

    if (loading) return <div className={styles.loader}>Loading the latest news...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <header className={styles.news_header}>
                <h1>BBC News</h1>
                {user?.interests?.length > 0 && (
                    <p className={styles.personalized_tag}>
                        Personalized for you based on: {user.interests.join(', ')}
                    </p>
                )}
            </header>
            
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
        </div>
    );
};

export default News;
