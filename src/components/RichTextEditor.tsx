import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import { useI18n } from '../i18n/I18nProvider';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const { t } = useI18n();
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontSize],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'rich-text-editor min-h-44 px-3 py-2 text-sm text-white outline-none' } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const buttonClass = 'min-h-9 min-w-9 rounded border border-slate-600 px-2 text-sm text-slate-200 hover:border-primary hover:text-primary';
  return (
    <div className="overflow-hidden rounded-md border border-slate-600 bg-field">
      <div aria-label={t('tech.formatting')} className="flex flex-wrap gap-1 border-b border-slate-600 p-2" role="toolbar">
        <button aria-label={t('tech.bold')} aria-pressed={editor.isActive('bold')} className={`${buttonClass} font-bold`} onClick={() => editor.chain().focus().toggleBold().run()} type="button">B</button>
        <button aria-label={t('tech.italic')} aria-pressed={editor.isActive('italic')} className={`${buttonClass} italic`} onClick={() => editor.chain().focus().toggleItalic().run()} type="button">I</button>
        <select aria-label={t('tech.fontSize')} className="min-h-9 rounded border border-slate-600 bg-panel px-2 text-sm text-slate-200" defaultValue="" onChange={(event) => { if (event.target.value) editor.chain().focus().setFontSize(event.target.value).run(); event.target.value = ''; }}>
          <option value="">{t('tech.fontSize')}</option><option value="12px">12</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="24px">24</option>
        </select>
        <button aria-label={t('tech.bulletList')} aria-pressed={editor.isActive('bulletList')} className={buttonClass} onClick={() => editor.chain().focus().toggleBulletList().run()} type="button">• •</button>
        <button aria-label={t('tech.orderedList')} aria-pressed={editor.isActive('orderedList')} className={buttonClass} onClick={() => editor.chain().focus().toggleOrderedList().run()} type="button">1. 2.</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}