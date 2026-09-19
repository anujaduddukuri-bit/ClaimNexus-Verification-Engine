import React from 'react';
import { ExternalLink } from 'lucide-react';

export const displayUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '');
};

export const SourceLink: React.FC<{ url?: string; title?: string }> = ({ url, title }) => {
  if (!url) {
    return <span className="text-[#9A9B91]">{title || 'No source URL'}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={url}
      className="text-[#B46A45] hover:text-[#C29B5B] font-mono text-[10px] flex flex-col min-w-0"
    >
      <span className="inline-flex items-center truncate">
        <span className="truncate">{title || displayUrl(url)}</span>
        <ExternalLink className="w-2.5 h-2.5 ml-1 flex-shrink-0" />
      </span>
      <span className="truncate text-[#9A9B91] normal-case">{displayUrl(url)}</span>
    </a>
  );
};

export const FormattedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={className}>{parseInlineFormatting(text || '')}</span>
);

export const renderFormattedContent = (text: string): React.ReactNode => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed font-sans text-[#E5DED0]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const isHeading =
          trimmed.startsWith('#') ||
          /^[1-9]\.\s+[A-Z][A-Z\s]{3,}/.test(trimmed) ||
          /^(CLAIM VERIFICATION|GROUNDED PROOFS|TECHNICAL ANALYSIS|EXPLAINABLE SYNTHESIS|ANALYTICAL INSIGHTS|AI RESEARCH AGENT SUMMARY|SUMMARY|VERDICT)/.test(trimmed);

        if (isHeading) {
          const headingText = trimmed.replace(/#{1,6}\s?/, '').trim();
          return (
            <h2
              key={idx}
              className="text-xs font-bold font-mono text-[#E5DED0] border-l-2 border-[#B46A45] pl-2.5 py-1 my-2 bg-[#15201A] rounded-r border-t border-b border-r border-[#304036] tracking-wider uppercase flex items-center justify-between"
            >
              <span>{parseInlineFormatting(headingText)}</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#0D1512] text-[#C29B5B] rounded border border-[#304036] font-mono">
                SECTION
              </span>
            </h2>
          );
        }

        if (trimmed.startsWith('####') || (trimmed.startsWith('- ') && trimmed.includes(':'))) {
          const subText = trimmed.replace(/^####\s?/, '').replace(/^-\s?/, '').trim();
          return (
            <h3 key={idx} className="text-[11px] font-mono font-semibold text-[#C29B5B] mt-2 mb-1 flex items-center space-x-1">
              <span className="text-[#B46A45] font-bold">•</span>
              <span>{parseInlineFormatting(subText)}</span>
            </h3>
          );
        }

        return (
          <p key={idx} className="text-xs text-[#E5DED0]/90 leading-relaxed pl-1 break-words">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

function parseInlineFormatting(text: string): React.ReactNode[] {
  try {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|(https?:\/\/[^\s<]+)|\*([^*]+)\*/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    const pushText = (value: string) => {
      if (!value) return;
      elements.push(value.replace(/\*{1,2}/g, '').replace(/_{2}/g, ''));
    };

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        pushText(text.substring(lastIndex, match.index));
      }

      const mdTitle = match[1];
      const mdHref = match[2];
      const boldMatch = match[3] || match[4];
      const codeMatch = match[5];
      const urlMatch = match[6];
      const italicMatch = match[7];

      if (mdHref) {
        elements.push(
          <a
            key={`md-${key++}`}
            href={mdHref}
            target="_blank"
            rel="noreferrer"
            className="text-[#B46A45] hover:text-[#C29B5B] underline font-mono text-[11px] break-all"
            title={mdHref}
          >
            {mdTitle || displayUrl(mdHref)}
          </a>
        );
      } else if (urlMatch) {
        const cleanUrl = urlMatch.replace(/[.,;)]+$/, '');
        elements.push(
          <a
            key={`url-${key++}`}
            href={cleanUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#B46A45] hover:text-[#C29B5B] underline font-mono text-[11px] inline-flex items-center px-1.5 py-0.5 rounded bg-[#0D1512] border border-[#304036] transition-colors mx-0.5 break-all"
            title={cleanUrl}
          >
            <span className="break-all">{displayUrl(cleanUrl)}</span>
            <ExternalLink className="w-2.5 h-2.5 ml-1 flex-shrink-0" />
          </a>
        );
      } else if (codeMatch) {
        elements.push(
          <code key={`code-${key++}`} className="font-mono text-[11px] bg-[#0D1512] px-1 rounded border border-[#304036]">
            {codeMatch}
          </code>
        );
      } else if (boldMatch) {
        elements.push(
          <strong key={`b-${key++}`} className="font-bold text-[#E5DED0]">
            {boldMatch.replace(/\*/g, '')}
          </strong>
        );
      } else if (italicMatch) {
        elements.push(
          <em key={`i-${key++}`} className="italic text-[#E5DED0]">
            {italicMatch}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      pushText(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : [text.replace(/\*{1,2}/g, '')];
  } catch {
    return [String(text || '').replace(/\*{1,2}/g, '')];
  }
}
