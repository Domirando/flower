import React from 'react';
import styles from './About.module.css';

const About = () => {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>About Flower</h1>
                <p className={styles.subtitle}>Connecting people through shared moments and beautiful posts.</p>
            </div>
            
            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>Our Mission</h2>
                    <p>
                        Flower is a modern social platform designed to help you share your thoughts, news, and 
                        interests with ease. Integrated with Telegram, it allows you to cross-post your updates 
                        seamlessly.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Features</h2>
                    <ul className={styles.list}>
                        <li>✨ Personalized User Profiles</li>
                        <li>telegram Cross-posting to Telegram Channels</li>
                        <li>💬 Real-time Messaging with Dialogs</li>
                        <li>📚 Book Tracking and Recommendations</li>
                        <li>🎵 Music Integration</li>
                        <li>📰 Latest News Feed</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>Join Us</h2>
                    <p>
                        Whether you are a reader, a writer, or just someone who loves sharing life's moments,
                        Flower is the place for you. Sign up today and start your journey!
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Community & Discord</h2>
                    <p>
                        Have questions, ideas, or just want to hang out? Join our Discord — feel free to chat,
                        share feedback, and connect with other Flower users. We'd love to hear from you!
                    </p>
                    <a
                        href="https://discord.gg/EhRW2Dxke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        Join our Discord server →
                    </a>
                </section>

                <section className={styles.section}>
                    <h2>Open Source</h2>
                    <p>
                        Flower is an open source project. Explore the code, report issues, or contribute on GitHub —
                        every pull request is welcome!
                    </p>
                    <a
                        href="https://github.com/domirando/flower"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        github.com/domirando/flower →
                    </a>
                </section>
            </div>
        </div>
    );
};

export default About;
