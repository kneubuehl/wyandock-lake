'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRef, useCallback } from 'react'
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
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [editor])

  if (!editor) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        <button
          type="button"
          className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${editor.isActive('orderedList') ? 'bg-accent text-accent-foreground' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }}
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="rich-content text-sm p-4 min-h-[200px]" />
    </div>
  )
}
