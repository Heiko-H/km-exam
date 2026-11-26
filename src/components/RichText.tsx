import DOMPurify from 'dompurify';

export function RichText({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`rich-text-content ${className}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}