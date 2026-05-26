import React from 'react';

const SAFE_URL = /^https?:\/\//i;

function safeUrl(url) {
    return SAFE_URL.test(url) ? url : '#';
}

// Parses a single line of text and returns an array of React nodes.
function parseInline(text, keyPrefix) {
    const parts = [];
    // Groups: 1=img-alt, 2=img-url, 3=link-text, 4=link-url, 5=bold, 6=italic
    const regex = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|_(.+?)_/g;
    let lastIndex = 0;
    let match;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const key = `${keyPrefix}-${idx++}`;
        if (match[1] !== undefined) {
            parts.push(
                <img key={key} src={safeUrl(match[2])} alt={match[1]} style={{ maxWidth: '100%', borderRadius: 6 }} />
            );
        } else if (match[3] !== undefined) {
            parts.push(
                <a key={key} href={safeUrl(match[4])} target="_blank" rel="noopener noreferrer"
                   style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    {match[3]}
                </a>
            );
        } else if (match[5] !== undefined) {
            parts.push(<strong key={key}>{match[5]}</strong>);
        } else if (match[6] !== undefined) {
            parts.push(<em key={key}>{match[6]}</em>);
        }
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

export function extractPoster(content) {
    const match = content.match(/^!\[poster\]\(([^)]+)\)\n*/);
    if (match) {
        return {
            posterUrl: SAFE_URL.test(match[1]) ? match[1] : null,
            text: content.slice(match[0].length).trim(),
        };
    }
    return { posterUrl: null, text: content };
}

export function RenderMarkdown({ content }) {
    const lines = content.split('\n');
    return (
        <>
            {lines.map((line, i) => (
                <React.Fragment key={i}>
                    {parseInline(line, `l${i}`)}
                    {i < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </>
    );
}
