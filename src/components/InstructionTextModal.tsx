import React from 'react';
import { X, FileText } from 'lucide-react';

interface InstructionTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
}

export const InstructionTextModal: React.FC<InstructionTextModalProps> = ({ isOpen, onClose, title, text }) => {
  if (!isOpen) return null;

  // Normaliseer inline opsommingen naar nieuwe regels zodat de parser ze herkent
  const preprocessText = (raw: string) => {
    if (!raw) return '';
    let normalized = raw;
    // Zet " 1. " of " 2. " middenin een zin om naar een nieuwe regel
    normalized = normalized.replace(/\s(\d+\.)\s/g, '\n$1 ');
    // Zet " - " middenin een zin om naar een nieuwe regel
    normalized = normalized.replace(/\s-\s/g, '\n- ');
    return normalized;
  };

  const preparedText = preprocessText(text);

  const renderInlineWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[\w\-._~:/?#\[\]@!$&'()*+,;=%]+)/gi;
    const parts = content.split(urlRegex);
    return parts.map((part, idx) => {
      if (urlRegex.test(part)) {
        return (
          <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
            {part}
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const renderFormatted = (raw: string) => {
    const lines = raw.split(/\r?\n/);
    const elements: JSX.Element[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }

      // Geordende lijst (1. 2. ...)
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
          i++;
        }
        // Splits mogelijke trailing tekst na eerste volledige zin
        const processed = items.map((raw) => {
          if (/https?:\/\//i.test(raw)) {
            return { main: raw.trim(), rest: null as string | null };
          }
          const m = raw.match(/^([\s\S]*?\.)\s+(.+)$/);
          if (m) {
            return { main: m[1].trim(), rest: m[2].trim() };
          }
          return { main: raw.trim(), rest: null as string | null };
        });
        elements.push(
          <ol key={`ol-${i}`} className="list-decimal ml-6 space-y-1">
            {processed.map((it, idx) => (
              <li key={idx} className="text-gray-700">{renderInlineWithLinks(it.main)}</li>
            ))}
          </ol>
        );
        // Eventuele remainders als losse paragrafen erna
        processed.forEach((it, idx2) => {
          if (it.rest) {
            elements.push(
              <p key={`ol-rest-${i}-${idx2}`} className="text-gray-700">{renderInlineWithLinks(it.rest)}</p>
            );
          }
        });
        continue;
      }

      // Ongeordende lijst (- of *)
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        const processed = items.map((raw) => {
          if (/https?:\/\//i.test(raw)) {
            return { main: raw.trim(), rest: null as string | null };
          }
          const m = raw.match(/^([\s\S]*?\.)\s+(.+)$/);
          if (m) {
            return { main: m[1].trim(), rest: m[2].trim() };
          }
          return { main: raw.trim(), rest: null as string | null };
        });
        elements.push(
          <ul key={`ul-${i}`} className="list-disc ml-6 space-y-1">
            {processed.map((it, idx) => (
              <li key={idx} className="text-gray-700">{renderInlineWithLinks(it.main)}</li>
            ))}
          </ul>
        );
        processed.forEach((it, idx2) => {
          if (it.rest) {
            elements.push(
              <p key={`ul-rest-${i}-${idx2}`} className="text-gray-700">{renderInlineWithLinks(it.rest)}</p>
            );
          }
        });
        continue;
      }

      // Paragraaf (verzamel doorlopende niet-lege regels tot lege regel)
      const para: string[] = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      elements.push(
        <p key={`p-${i}`} className="text-gray-700 whitespace-pre-line">{renderInlineWithLinks(para.join('\n'))}</p>
      );
    }
    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Instructies</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">
          <h4 className="text-base font-medium text-gray-900 mb-2">{title}</h4>
          <div className="text-sm leading-relaxed space-y-2">
            {renderFormatted(preparedText)}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Sluiten</button>
        </div>
      </div>
    </div>
  );
};


