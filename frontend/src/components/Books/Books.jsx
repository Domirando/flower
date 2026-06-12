import React, { useState, useEffect } from 'react';
import { supabase } from "../../helper/supabaseClient";
import styles from './Books.module.css';
import { HiSearch, HiUpload, HiBookOpen, HiDownload, HiShoppingCart, HiTrash } from 'react-icons/hi';

const Books = () => {
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'my-library' | 'upload'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadForm, setUploadForm] = useState({ title: '', authors: '', file: null });
    const [deleting, setDeleting] = useState(null);

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
            const backendUrl = process.env.REACT_APP_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');
            const response = await fetch(`${backendUrl}/api/books/search?q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) throw new Error('Failed to search books');
            const data = await response.json();
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
            const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setMyBooks(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBook = async (book) => {
        if (!window.confirm(`Delete "${book.title}"?`)) return;
        setDeleting(book.id);
        try {
            if (book.file_path) {
                await supabase.storage.from('books').remove([book.file_path]);
            }
            const { error } = await supabase.from('books').delete().eq('id', book.id);
            if (error) throw error;
            setMyBooks(prev => prev.filter(b => b.id !== book.id));
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const { title, authors, file } = uploadForm;
        if (!title || !file) {
            alert('Please provide title and file');
            return;
        }

        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData.user;
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `books/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('books')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase.from('books').insert({
                user_id: user.id,
                title,
                authors: authors.split(',').map(s => s.trim()),
                file_url: publicUrl,
                file_path: filePath
            });

            if (dbError) throw dbError;

            alert('Book uploaded successfully!');
            setUploadForm({ title: '', authors: '', file: null });
            setActiveTab('my-library');
        } catch (err) {
            console.error('Upload error:', err);
            let msg = err.message;
            if (err.message === 'bucket_not_found' || err.status === 404) {
                msg = 'Storage bucket "books" not found. Please ensure it is created in your Supabase dashboard.';
            }
            alert(msg);
        } finally {
            setLoading(false);
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
                                    {book.thumbnail ? (
                                        <img src={book.thumbnail} alt={book.title} className={styles.thumbnail} />
                                    ) : (
                                        <HiBookOpen size={64} color="#CBD5E0" />
                                    )}
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
                    {loading ? <div className={styles.loader}>Loading your library...</div> : (
                        myBooks.length > 0 ? (
                            myBooks.map(book => (
                                <div key={book.id} className={styles.my_book_item}>
                                    <HiBookOpen size={24} className="text-blue-500" />
                                    <div className={styles.my_book_info}>
                                        <h4 className="font-bold">{book.title}</h4>
                                        <p className="text-sm text-gray-500">{book.authors?.join(', ')}</p>
                                    </div>
                                    <div className={styles.my_book_actions}>
                                        <a href={book.file_url} download className={styles.download_btn}>
                                            <HiDownload /> Download
                                        </a>
                                        <button
                                            onClick={() => handleDeleteBook(book)}
                                            className={styles.delete_btn}
                                            disabled={deleting === book.id}
                                        >
                                            <HiTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : <div className={styles.no_results}>Your library is empty. Upload some books!</div>
                    )}
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
                                onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label className={styles.label}>Authors (comma separated)</label>
                            <input 
                                type="text" 
                                className={styles.input}
                                value={uploadForm.authors}
                                onChange={e => setUploadForm({...uploadForm, authors: e.target.value})}
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label className={styles.label}>File (PDF, EPUB, etc.) *</label>
                            <input 
                                type="file" 
                                className={styles.input}
                                onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.upload_btn} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload to Library'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Books;