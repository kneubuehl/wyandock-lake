'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRef } from 'react'
import { toast } from 'sonner'

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichEditor({ content, onChange, placeholder = 'Start writing...' }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { data, error } = await supabase.storage
      .from('procedure-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) {
      toast.error('Image upload failed: ' + error.message)
      return
    }

    const { data: urlData } = supabase.storage
      .from('procedure-images')
      .getPublicUrl(data.path)

    editor.chain().focus().setImage({ src: urlData.publicUrl }).run()

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!editor) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}>
          <Bold className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="w-px h-6 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-2" />
    </div>
  )
}
