import React from 'react';
import ReactMarkdown from 'react-markdown';
import { bibleStructure } from '../../constants';

const BibleTextWithRefs = ({ text, onLookup, onSuggestionClick }) => {
  if (!text) return null;

  // 1. Prepare Regex for Bible Books
  const booksRegexPart = bibleStructure.map(b => b.name.replace(/\s+/g, '\\s+')).join('|');
  const bibleRegex = new RegExp(`(${booksRegexPart})\\s+(\\d+:\\d+(?:-\\d+)?)`, 'gi');

  // 2. Helper to render text containing potential Bible references
  const processTextNode = (content) => {
    if (typeof content !== 'string') return content;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    bibleRegex.lastIndex = 0;

    while ((match = bibleRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const refText = match[0];
      parts.push(
        <span 
          key={match.index} 
          className="bible-ref-link" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLookup(refText, e); }}
          title={`Lookup ${refText}`}
        >
          {refText}
        </span>
      );
      lastIndex = match.index + refText.length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return parts;
  };

  // 3. Recursively process children to find text nodes
  const processChildren = (children) => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') return processTextNode(child);
      if (React.isValidElement(child) && child.props.children) {
        return React.cloneElement(child, {
          children: processChildren(child.props.children)
        });
      }
      return child;
    });
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          // Intercept paragraphs, list items, etc. to process their text children
          p: ({ children }) => <p>{processChildren(children)}</p>,
          li: ({ children, ...props }) => {
            const textContent = React.Children.toArray(children)
              .map(c => typeof c === 'string' ? c : (c.props?.children?.toString() || ''))
              .join('');
            
            return (
              <li 
                className={onSuggestionClick ? "clickable-suggestion" : ""} 
                onClick={() => onSuggestionClick && onSuggestionClick(textContent)}
                {...props}
              >
                {processChildren(children)}
              </li>
            );
          },
          // Ensure bold/italic nodes also get processed
          strong: ({ children }) => <strong>{processChildren(children)}</strong>,
          em: ({ children }) => <em>{processChildren(children)}</em>,
          h1: ({ children }) => <h1>{processChildren(children)}</h1>,
          h2: ({ children }) => <h2>{processChildren(children)}</h2>,
          h3: ({ children }) => <h3>{processChildren(children)}</h3>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default BibleTextWithRefs;
