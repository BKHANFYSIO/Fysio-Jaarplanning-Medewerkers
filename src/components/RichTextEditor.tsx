import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
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

    const handler = () => {
      const html = quill.root.innerHTML;
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
    const current = quill.root.innerHTML;
    if (value !== current) {
      const selection = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value || '');
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


