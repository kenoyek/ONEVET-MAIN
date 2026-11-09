import ReactMarkdown from 'react-markdown';
import './article-reading.css';

/** Markdown is rendered as React elements. Raw HTML and unsafe URL schemes are disabled. */
export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="article-prose">
      <ReactMarkdown
        skipHtml
        components={{
          // The article title owns the page's single h1.
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ children, href }) => <a href={href} rel="noopener noreferrer">{children}</a>,
          img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" decoding="async" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
