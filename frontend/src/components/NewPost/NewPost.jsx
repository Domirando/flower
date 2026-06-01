import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import styles from "./NewPost.module.css";

// ── Attachment picker helpers ─────────────────────────────────────────────────
function useLibraryAttachments() {
    const [songs, setSongs] = useState([]);
    const [books, setBooks] = useState([]);
    useEffect(() => {
        api.getSongs().then(({ songs }) => setSongs(songs)).catch(() => {});
        api.getBooks().then(({ books }) => setBooks(books)).catch(() => {});
    }, []);
    return { songs, books };
}

const EMOJIS = [
    '😀','😂','🥰','😎','🤔','😅','🤣','😊','😢','😤','🥹','😭','🤯','🥳','😇',
    '❤️','🧡','💛','💚','💙','💜','🖤','💔','💝','💖',
    '👍','👎','👏','🙌','🤝','🙏','✌️','🤞','💪','🫶',
    '🎉','🎊','🏆','🥇','🎯','🚀','💡','📝','🎵','🎶',
    '🌸','🌺','🌻','🌈','⭐','✨','💫','🔥','❄️','🌊','🌙','☀️','⚡','🌍',
    '🍕','🍔','🌮','☕','🍷','🎮','💻','📱',
];

export default function NewPost() {
    const [text, setText] = useState("");
    const [posterUrl, setPosterUrl] = useState("");
    const [posterPreview, setPosterPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState("https://");
    const [channels, setChannels] = useState([]);       // all user channels
    const [selected, setSelected] = useState(new Set()); // checked ones

    const [attachedFiles, setAttachedFiles] = useState([]); // [{url,name,type}]
    const [showAttachments, setShowAttachments] = useState(false);

    const textareaRef = useRef(null);
    const savedSel = useRef({ start: 0, end: 0 });
    const fileInputRef = useRef(null);

    const { songs, books } = useLibraryAttachments();

    // Load user's channels on mount
    useEffect(() => {
        api.getMe().then((user) => {
            const chs = user.telegram_channels || [];
            setChannels(chs);
            setSelected(new Set(chs));
        }).catch(() => {});
    }, []);

    const toggleAttachment = (item, type) => {
        const att = { url: item.file_url, name: item.title, type };
        setAttachedFiles(prev => {
            const exists = prev.some(a => a.url === att.url);
            return exists ? prev.filter(a => a.url !== att.url) : [...prev, att];
        });
    };

    const isAttached = (url) => attachedFiles.some(a => a.url === url);

    // ── Formatting helpers ────────────────────────────────────────────────────

    const wrapSelection = (before, after) => {
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = text.slice(start, end);
        const next = text.slice(0, start) + before + selected + after + text.slice(end);
        setText(next);
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertAt = (str) => {
        const el = textareaRef.current;
        const pos = el.selectionStart;
        const next = text.slice(0, pos) + str + text.slice(pos);
        setText(next);
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(pos + str.length, pos + str.length);
        }, 0);
    };

    // ── Toolbar actions ───────────────────────────────────────────────────────

    const handleBold = () => wrapSelection("**", "**");
    const handleItalic = () => wrapSelection("_", "_");

    const handleLinkOpen = () => {
        const el = textareaRef.current;
        savedSel.current = { start: el.selectionStart, end: el.selectionEnd };
        setLinkUrl("https://");
        setShowLinkDialog(true);
        setShowEmoji(false);
    };

    const handleLinkInsert = () => {
        const url = linkUrl.trim();
        if (!url || url === "https://") return;
        const { start, end } = savedSel.current;
        const sel = text.slice(start, end) || "link text";
        const insertion = `[${sel}](${url})`;
        const next = text.slice(0, start) + insertion + text.slice(end);
        setText(next);
        setShowLinkDialog(false);
        setTimeout(() => {
            textareaRef.current.focus();
            const p = start + insertion.length;
            textareaRef.current.setSelectionRange(p, p);
        }, 0);
    };

    const handleEmoji = (emoji) => {
        insertAt(emoji);
        setShowEmoji(false);
    };

    // ── Poster upload (shared logic for button & drag-drop) ───────────────────

    const processPosterFile = useCallback(async (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        const preview = URL.createObjectURL(file);
        setPosterPreview(preview);
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("image", file);
            const data = await api.uploadPostImage(fd);
            setPosterUrl(data.url);
        } catch (err) {
            alert("Image upload failed: " + err.message);
            setPosterPreview("");
        } finally {
            setUploading(false);
        }
    }, []);

    const handlePosterFile = (e) => {
        processPosterFile(e.target.files[0]);
    };

    const removePoster = () => {
        setPosterUrl("");
        setPosterPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Drag & drop ───────────────────────────────────────────────────────────

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processPosterFile(file);
    };

    // ── Channel toggles ───────────────────────────────────────────────────────

    const toggleChannel = (ch) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(ch) ? next.delete(ch) : next.add(ch);
            return next;
        });
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const addPost = async () => {
        const body = text.trim();
        if (!body && !posterUrl) return;
        const content = posterUrl ? `![poster](${posterUrl})\n\n${body}` : body;
        const channelList = [...selected];
        const attachments = attachedFiles.length ? attachedFiles : undefined;
        setLoading(true);
        try {
            await api.createPost(content, channelList, attachments);
            setText("");
            setPosterUrl("");
            setPosterPreview("");
            setAttachedFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const canPost = !loading && !uploading && (!!text.trim() || !!posterUrl);

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>New Post</h1>

            {/* Poster drop zone */}
            <div
                className={`${styles.poster_wrap} ${isDragging ? styles.dragging : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                {posterPreview ? (
                    <div className={styles.poster_preview_wrap}>
                        <img src={posterPreview} alt="poster" className={styles.poster_preview} />
                        {uploading && <span className={styles.uploading_badge}>Uploading…</span>}
                        <button onClick={removePoster} className={styles.poster_remove} title="Remove">✕</button>
                    </div>
                ) : (
                    <button
                        className={styles.poster_btn}
                        onClick={() => fileInputRef.current.click()}
                        disabled={loading}
                    >
                        📷 Add poster — or drag & drop an image here
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePosterFile}
                    className={styles.hidden_file}
                />
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <button className={styles.tool_btn} onClick={handleBold} title="Bold"><strong>B</strong></button>
                <button className={styles.tool_btn} onClick={handleItalic} title="Italic"><em>I</em></button>
                <button className={styles.tool_btn} onClick={handleLinkOpen} title="Link">🔗</button>
                <button
                    className={`${styles.tool_btn} ${showEmoji ? styles.tool_btn_active : ""}`}
                    onClick={() => { setShowEmoji(v => !v); setShowLinkDialog(false); }}
                    title="Emoji"
                >😊</button>
            </div>

            {/* Link dialog */}
            {showLinkDialog && (
                <div className={styles.link_dialog}>
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleLinkInsert(); if (e.key === 'Escape') setShowLinkDialog(false); }}
                        placeholder="https://"
                        className={styles.link_input}
                        autoFocus
                    />
                    <button onClick={handleLinkInsert} className={styles.link_confirm}>Insert</button>
                    <button onClick={() => setShowLinkDialog(false)} className={styles.link_cancel}>Cancel</button>
                </div>
            )}

            {/* Emoji picker */}
            {showEmoji && (
                <div className={styles.emoji_picker}>
                    {EMOJIS.map((emoji) => (
                        <button key={emoji} className={styles.emoji_btn} onClick={() => handleEmoji(emoji)}>
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setShowEmoji(false); setShowLinkDialog(false); } }}
                placeholder="Write your post… (select text, then B / I to style it)"
                disabled={loading}
                className={styles.textarea}
            />

            {/* Channel selector */}
            {channels.length > 0 && (
                <div className={styles.channels_wrap}>
                    <span className={styles.channels_label}>Post to:</span>
                    {channels.map((ch) => (
                        <label key={ch} className={styles.channel_item}>
                            <input
                                type="checkbox"
                                checked={selected.has(ch)}
                                onChange={() => toggleChannel(ch)}
                            />
                            <span>{ch}</span>
                        </label>
                    ))}
                </div>
            )}

            {/* Attachment picker (books & songs) */}
            {(songs.length > 0 || books.length > 0) && (
                <div className={styles.attachments_wrap}>
                    <button
                        type="button"
                        className={`${styles.tool_btn} ${showAttachments ? styles.tool_btn_active : ''}`}
                        onClick={() => setShowAttachments(v => !v)}
                        title="Attach file"
                    >
                        📎 Attach {attachedFiles.length > 0 ? `(${attachedFiles.length})` : ''}
                    </button>

                    {showAttachments && (
                        <div className={styles.attachment_panel}>
                            {songs.length > 0 && (
                                <div className={styles.att_group}>
                                    <span className={styles.att_group_label}>🎵 Songs</span>
                                    {songs.map(s => (
                                        <label key={s.id} className={styles.att_item}>
                                            <input
                                                type="checkbox"
                                                checked={isAttached(s.file_url)}
                                                onChange={() => toggleAttachment(s, 'audio')}
                                            />
                                            <span>{s.title}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {books.length > 0 && (
                                <div className={styles.att_group}>
                                    <span className={styles.att_group_label}>📚 Books</span>
                                    {books.map(b => (
                                        <label key={b.id} className={styles.att_item}>
                                            <input
                                                type="checkbox"
                                                checked={isAttached(b.file_url)}
                                                onChange={() => toggleAttachment(b, 'document')}
                                            />
                                            <span>{b.title}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {attachedFiles.length > 0 && (
                        <div className={styles.attached_list}>
                            {attachedFiles.map(a => (
                                <span key={a.url} className={styles.attached_tag}>
                                    {a.type === 'audio' ? '🎵' : '📄'} {a.name}
                                    <button onClick={() => setAttachedFiles(prev => prev.filter(x => x.url !== a.url))}>✕</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <button onClick={addPost} disabled={!canPost} className={styles.post_btn}>
                {loading ? "Posting…" : "Post"}
            </button>
        </div>
    );
}
