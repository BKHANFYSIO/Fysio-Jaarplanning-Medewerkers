import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  htmlRef?: React.MutableRefObject<string | null>;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, htmlRef }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);

  // Houd altijd de nieuwste onChange vast, zodat het handler-ref niet veroudert
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const toolbarOptions = [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }],
      ['link'],
      ['clean'],
    ];

    quillRef.current = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: toolbarOptions },
    });

    const quill = quillRef.current;
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }
    // Zet initiële waarde in ref
    if (htmlRef) {
      htmlRef.current = quill.root.innerHTML;
    }

    const handler = (_delta: any, _old: any, source: string) => {
      if (source !== 'user') return; // Alleen user-input doorgeven
      const html = quill.root.innerHTML;
      if (htmlRef) {
        htmlRef.current = html;
      }
      if (onChangeRef.current) {
        onChangeRef.current(html);
      }
    };
    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler as any);
    };
  }, [placeholder, value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    // Als de gebruiker aan het typen is, niet forceren om de content te vervangen
    if (quill.hasFocus()) return;
    const current = quill.root.innerHTML;
    if (value !== current) {
      const selection = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value || '');
      if (htmlRef) {
        htmlRef.current = quill.root.innerHTML;
      }
      if (selection) {
        quill.setSelection(selection);
      }
    }
  }, [value]);

  return (
    <div>
      <div ref={containerRef} />
    </div>
  );
};

export default RichTextEditor;


