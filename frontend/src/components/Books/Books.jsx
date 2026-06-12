import React, { useState, useEffect } from 'react';
import { api, uploadFileToR2 } from '../../api/client';
import styles from './Books.module.css';
import { HiSearch, HiUpload, HiBookOpen, HiDownload, HiShoppingCart } from 'react-icons/hi';

const Books = () => {
    const [activeTab, setActiveTab] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
    const [error, setError] = useState(null);
    const [uploadForm, setUploadForm] = useState({ title: '', authors: '', file: null });

    useEffect(() => {
        if (activeTab === 'my-library') {
            fetchMyBooks();
        }
    }, [activeTab]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.searchBooks(searchQuery);
            setSearchResults(data.books || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyBooks = async () => {
        setLoading(true);
        try {
            const data = await api.getBooks();
            setMyBooks(data.books || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const { title, authors, file } = uploadForm;
        if (!title || !file) {
            alert('Please provide a title and file');
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        try {
            // Try direct R2 upload first
            let file_url, file_key;
            try {
                const result = await uploadFileToR2(file, 'books', (pct) => setUploadProgress(pct));
                file_url = result.public_url;
                file_key = result.key;
            } catch (r2err) {
                if (r2err.message.includes('R2 storage is not configured')) {
                    // Fallback: send file through backend
                    setUploadProgress(null);
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('authors', authors);
                    formData.append('file', file);
                    await api.uploadBook(formData);
                    alert('Book uploaded successfully!');
                    setUploadForm({ title: '', authors: '', file: null });
                    setActiveTab('my-library');
                    return;
                }
                throw r2err;
            }

            // Save metadata
            const authorList = authors
                ? authors.split(',').map(a => a.trim()).filter(Boolean)
                : [];
            await api.saveBook({ title, authors: authorList, file_url, file_key });

            alert('Book uploaded successfully!');
            setUploadForm({ title: '', authors: '', file: null });
            setActiveTab('my-library');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm('Delete this book?')) return;
        try {
            await api.deleteBook(id);
            setMyBooks(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Books & Library</h1>
            </header>

            <div className={styles.tabs}>
                <div
                    className={`${styles.tab} ${activeTab === 'search' ? styles.active_tab : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    <HiSearch size={18} /> Search
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'my-library' ? styles.active_tab : ''}`}
                    onClick={() => setActiveTab('my-library')}
                >
                    <HiBookOpen size={18} /> My Library
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'upload' ? styles.active_tab : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <HiUpload size={18} /> Upload
                </div>
            </div>

            {activeTab === 'search' && (
                <>
                    <form onSubmit={handleSearch} className={styles.search_section}>
                        <input
                            type="text"
                            placeholder="Search by title, author, or ISBN..."
                            className={styles.search_input}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className={styles.search_button} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.books_grid}>
                        {searchResults.map((book) => (
                            <div key={book.id} className={styles.book_card}>
                                <div className={styles.thumbnail_container}>
                                    {book.thumbnail
                                        ? <img src={book.thumbnail} alt={book.title} className={styles.thumbnail} />
                                        : <HiBookOpen size={64} color="#CBD5E0" />
                                    }
                                </div>
                                <div className={styles.book_info}>
                                    <h3 className={styles.book_title}>{book.title}</h3>
                                    <p className={styles.book_authors}>{book.authors.join(', ')}</p>
                                    <p className={styles.book_description}>{book.description}</p>
                                    <div className={styles.actions}>
                                        <a href={book.amazonLink} target="_blank" rel="noreferrer" className={`${styles.action_link} ${styles.amazon_btn}`}>
                                            <HiShoppingCart /> Amazon
                                        </a>
                                        <a href={book.zLibraryLink} target="_blank" rel="noreferrer" className={`${styles.action_link} ${styles.zlib_btn}`}>
                                            <HiDownload /> Z-Library
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!loading && searchResults.length === 0 && searchQuery && (
                        <div className={styles.no_results}>No books found for "{searchQuery}"</div>
                    )}
                </>
            )}

            {activeTab === 'my-library' && (
                <div className={styles.my_books_list}>
                    {loading
                        ? <div className={styles.loader}>Loading your library...</div>
                        : myBooks.length > 0
                            ? myBooks.map(book => (
                                <div key={book.id} className={styles.my_book_item}>
                                    <HiBookOpen size={24} />
                                    <div className={styles.my_book_info}>
                                        <h4>{book.title}</h4>
                                        <p>{book.authors?.join(', ')}</p>
                                    </div>
                                    <div className={styles.my_book_actions}>
                                        <a href={book.file_url} download className={styles.download_btn}>
                                            <HiDownload /> Download
                                        </a>
                                        <button
                                            onClick={() => handleDeleteBook(book.id)}
                                            className={styles.delete_btn}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                            : <div className={styles.no_results}>Your library is empty. Upload some books!</div>
                    }
                </div>
            )}

            {activeTab === 'upload' && (
                <div className={styles.upload_section}>
                    <h2>Upload a Book</h2>
                    <form onSubmit={handleUpload}>
                        <div className={styles.form_group}>
                            <label className={styles.label}>Title *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={uploadForm.title}
                                onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label className={styles.label}>Authors (comma separated)</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={uploadForm.authors}
                                onChange={e => setUploadForm({ ...uploadForm, authors: e.target.value })}
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label className={styles.label}>File (PDF, EPUB, etc.) *</label>
                            <input
                                type="file"
                                className={styles.input}
                                onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                accept=".pdf,.epub,.mobi,.fb2,.txt,.djvu"
                                required
                            />
                            {uploadForm.file && (
                                <span className={styles.file_name}>{uploadForm.file.name}</span>
                            )}
                        </div>

                        {/* Upload progress bar */}
                        {uploadProgress !== null && (
                            <div className={styles.progress_wrap}>
                                <div className={styles.progress_bar}>
                                    <div
                                        className={styles.progress_fill}
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className={styles.progress_label}>{uploadProgress}%</span>
                            </div>
                        )}

                        <button type="submit" className={styles.upload_btn} disabled={loading}>
                            {loading
                                ? (uploadProgress !== null ? `Uploading ${uploadProgress}%…` : 'Saving…')
                                : 'Upload to Library'
                            }
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Books;
