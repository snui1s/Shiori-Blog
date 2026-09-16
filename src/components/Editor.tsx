import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { useState, useEffect, useRef } from 'react'
import { STORAGE_KEY, CATEGORIES } from '../lib/constants'

export default function Editor({ initialSlug }: { initialSlug?: string }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState<string>('Journal')
  const [imageUrl, setImageUrl] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('')
  const [slugAvailable, setSlugAvailable] = useState(true)
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [pendingContent, setPendingContent] = useState<string | null>(null)
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number; pos: number }[]>([])
  const [showToc, setShowToc] = useState(true)
  const contentAppliedRef = useRef(false)
  const isEditing = !!initialSlug

  const updateHeadings = (ed: any) => {
    if (!ed) return
    const items: { id: string; text: string; level: number; pos: number }[] = []
    try {
      ed.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          const text = node.textContent?.trim()
          if (text) {
            items.push({
              id: `editor-h-${pos}`,
              text,
              level: node.attrs.level || 1,
              pos,
            })
          }
        }
      })
      setHeadings(items)
    } catch (e) {
      console.error('Failed to update headings', e)
    }
  }

  const jumpToHeading = (pos: number) => {
    if (!editor) return
    editor.chain().focus().setTextSelection(pos + 1).run()
    try {
      const coords = editor.view.coordsAtPos(pos + 1)
      if (coords) {
        const top = coords.top + window.scrollY - 160
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      }
    } catch (e) {
      console.error('Failed to scroll to heading', e)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
        },
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: 'เริ่มเขียนบันทึกของคุณที่นี่...',
        emptyNodeClass: 'is-empty',
      }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      saveToStorage({ content: editor.getHTML() })
      updateHeadings(editor)
    },
    onCreate: ({ editor }) => {
      updateHeadings(editor)
    }
  })

  // Load draft or existing post
  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        setStatus('กำลังดึงข้อมูลบทความ...')
        try {
          const res = await fetch(`/api/posts/${initialSlug}`);
          if (res.ok) {
            const data = await res.json();
            setTitle(data.title || '');
            setSlug(data.slug || '');
            setExcerpt(data.excerpt || '');
            if (CATEGORIES.includes(data.category as any)) {
              setCategory(data.category);
              setIsCustomCategory(false);
            } else {
              setCategory('Other');
              setIsCustomCategory(true);
              setCustomCategory(data.category || '');
            }
            setImageUrl(data.imageUrl || '');
            setAuthor(data.author || '');
            setPendingContent(data.content || '');
            setStatus('ดึงข้อมูลสำเร็จ ✨');
          } else {
            setStatus('ไม่พบบทความที่ต้องการแก้ไข');
          }
        } catch (e) {
          setStatus('ไม่สามารถดึงข้อมูลได้');
        }
      };
      fetchPost();
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.title) setTitle(draft.title)
        if (draft.slug) setSlug(draft.slug)
        if (draft.excerpt) setExcerpt(draft.excerpt)
        if (draft.category) setCategory(draft.category)
        if (draft.imageUrl) setImageUrl(draft.imageUrl)
        if (draft.author) setAuthor(draft.author)
        if (draft.content) {
          setPendingContent(draft.content)
        }
        setStatus('กู้คืนฉบับร่างเรียบร้อย ✨')
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [initialSlug, isEditing])

  // Sync content into editor once editor is ready
  useEffect(() => {
    if (editor && pendingContent !== null && !contentAppliedRef.current) {
      editor.commands.setContent(pendingContent);
      contentAppliedRef.current = true;
      updateHeadings(editor);
    }
  }, [editor, pendingContent])

  const saveToStorage = (updates: any) => {
    if (isEditing || !editor) return;
    const next = {
      title, slug, excerpt, category, imageUrl, author,
      content: editor.getHTML() || '',
      ...updates
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  // Auto-save field changes
  useEffect(() => {
    if (!isEditing && editor) {
      saveToStorage({})
    }
  }, [title, slug, excerpt, category, imageUrl, author])

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('ใส่ URL ลิงก์:', previousUrl || 'https://');

    if (url === null) return;
    if (url.trim() === '' || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim(), target: '_blank' }).run();
  };

  const openUploadWidget = () => {
    // @ts-ignore
    if (!window.cloudinary) {
      alert("Cloudinary widget ยังโหลดไม่เสร็จ กรุณารอสักครู่");
      return;
    }
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setImageUrl(result.info.secure_url);
        }
      }
    );
    widget.open();
  }

  const openEditorImageUpload = () => {
    if (!editor) return;
    // @ts-ignore
    if (!window.cloudinary) {
      const url = prompt("กรุณาระบุ URL รูปภาพที่ต้องการแทรก:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      return;
    }
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          editor.chain().focus().setImage({ src: result.info.secure_url }).run();
        }
      }
    );
    widget.open();
  }

  // Check slug availability
  useEffect(() => {
    if (!slug || (isEditing && slug === initialSlug)) {
      setSlugAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${slug}`);
        const data = await res.json();
        setSlugAvailable(!data.exists);
        if (data.exists) {
          setStatus('❌ URL นี้ถูกใช้ไปแล้วนะจ๊ะ ลองเปลี่ยนใหม่ดู');
        } else {
          setStatus('');
        }
      } catch (e) {
        console.error('Slug check failed', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, isEditing, initialSlug]);

  const savePost = async () => {
    if (!editor) return
    if (!slugAvailable) {
      setStatus('❌ กรุณาเปลี่ยน slug-url ก่อนจ้า เพราะมันซ้ำ!');
      return;
    }
    setStatus('กำลังบันทึก...')

    try {
      const content = editor.getHTML()
      const url = isEditing ? `/api/posts/${initialSlug}` : '/api/posts';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          category: isCustomCategory ? customCategory : category,
          author,
          image_url: imageUrl,
        }),
      })

      const result = await response.json();

      if (response.ok) {
        if (!isEditing) localStorage.removeItem(STORAGE_KEY)
        setStatus('บันทึกเรียบร้อย! กำลังพาไปดูหน้าโพสต์...')
        setTimeout(() => {
          window.location.href = `/blog/${slug}`
        }, 800)
      } else {
        setStatus(`❌ บันทึกไม่สำเร็จ: ${result.error || 'เกิดข้อผิดพลาดบางอย่าง'}`)
      }
    } catch (error) {
      console.error('Save post error:', error);
      setStatus('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  }

  const inputClasses = "w-full bg-surface-subtle border border-border text-text p-3.5 rounded-xl outline-none transition-all duration-300 focus:bg-surface focus:border-primary/50 focus:ring-2 focus:ring-primary/10 placeholder:text-text-subtle font-main";

  return (
    <div className="bg-surface p-6 md:p-10 rounded-[2rem] border border-border space-y-8 animate-fade-in shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">หัวข้อบทความ</label>
          <input 
            type="text" 
            placeholder="พิมพ์หัวข้อที่นี่..." 
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!isEditing) {
                setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))
              }
            }}
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Slug-URL</label>
          <input 
            type="text" 
            placeholder="url-friendly-slug" 
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${inputClasses} ${!slugAvailable ? 'border-primary ring-2 ring-primary/20' : ''}`}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">หมวดหมู่</label>
          <div className="flex flex-col gap-3">
            <select 
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setIsCustomCategory(e.target.value === 'Other');
              }}
              className={`${inputClasses} appearance-none cursor-pointer`}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-surface text-text">{cat}</option>
              ))}
              <option value="Other" className="bg-surface text-text">✨ อื่นๆ (ระบุเอง)</option>
            </select>
            {isCustomCategory && (
              <input 
                type="text" 
                placeholder="ระบุหมวดหมู่ใหม่..." 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className={`${inputClasses} border-primary/40`}
              />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">ชื่อผู้เขียน</label>
          <input 
            type="text" 
            placeholder="ชื่อที่จะแสดง..." 
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">รูปภาพหน้าปก</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="แปะลิงก์รูปภาพ หรือกดเลือกรูปจากเครื่อง..." 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClasses}
            />
            <button 
              type="button" 
              onClick={openUploadWidget} 
              className="whitespace-nowrap bg-surface-subtle text-text px-6 rounded-xl border border-border font-bold hover:bg-surface hover:border-primary/40 transition-all cursor-pointer shadow-xs"
            >
              เลือกไฟล์
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">คำโปรย (Excerpt)</label>
        <textarea 
          placeholder="สรุปเนื้อหาสั้นๆ ให้น่าดึงดูด..." 
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={`${inputClasses} min-h-[100px] resize-none`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between ml-1">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">เนื้อหาบันทึก (Content Editor)</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowToc(!showToc)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showToc 
                  ? 'bg-primary/15 border-primary/30 text-primary shadow-xs' 
                  : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-subtle'
              }`}
              title="เปิด/ปิด แถบสารบัญโครงร่างเนื้อหา"
            >
              <span className="font-serif font-bold text-primary">目</span>
              <span>สารบัญ ({headings.length})</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${showToc ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <span className="text-xs text-text-subtle font-medium hidden sm:inline">Rich Text Editor</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main TipTap Editor Area */}
          <div className={`${showToc ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} transition-all duration-300 w-full`}>
            <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-inner transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
              <div className="p-3 bg-surface-subtle flex flex-wrap gap-1.5 md:gap-2 border-b border-border items-center">
                {/* 1. Headings */}
                <ToolbarBtn 
                  title="หัวข้อหลัก H1" 
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} 
                  active={editor?.isActive('heading', { level: 1 }) || false}
                >
                  <span className="font-black text-xs">H1</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="หัวข้อ H2" 
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
                  active={editor?.isActive('heading', { level: 2 }) || false}
                >
                  <span className="font-extrabold text-xs">H2</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="หัวข้อย่อย H3" 
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} 
                  active={editor?.isActive('heading', { level: 3 }) || false}
                >
                  <span className="font-extrabold text-xs">H3</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="หัวข้อย่อยลึก H4" 
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()} 
                  active={editor?.isActive('heading', { level: 4 }) || false}
                >
                  <span className="font-extrabold text-xs">H4</span>
                </ToolbarBtn>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                {/* 2. Text Styles */}
                <ToolbarBtn 
                  title="ตัวหนา (Ctrl+B)" 
                  onClick={() => editor?.chain().focus().toggleBold().run()} 
                  active={editor?.isActive('bold') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ตัวเอียง (Ctrl+I)" 
                  onClick={() => editor?.chain().focus().toggleItalic().run()} 
                  active={editor?.isActive('italic') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ขีดเส้นใต้ (Ctrl+U)" 
                  onClick={() => editor?.chain().focus().toggleUnderline().run()} 
                  active={editor?.isActive('underline') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ขีดฆ่า (Strikethrough)" 
                  onClick={() => editor?.chain().focus().toggleStrike().run()} 
                  active={editor?.isActive('strike') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"></path><path d="M14 12a4 4 0 0 1 0 8H6"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="โค้ดในบรรทัด (Inline Code)" 
                  onClick={() => editor?.chain().focus().toggleCode().run()} 
                  active={editor?.isActive('code') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="แทรกลิงก์ (Link)" 
                  onClick={setLink} 
                  active={editor?.isActive('link') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </ToolbarBtn>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                {/* 3. Lists & Blocks */}
                <ToolbarBtn 
                  title="รายการแบบจุด (Bullet List)" 
                  onClick={() => editor?.chain().focus().toggleBulletList().run()} 
                  active={editor?.isActive('bulletList') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="รายการแบบตัวเลข (Numbered List)" 
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
                  active={editor?.isActive('orderedList') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="บล็อกคำคม (Blockquote)" 
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()} 
                  active={editor?.isActive('blockquote') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="บล็อกโค้ดโปรแกรม (Code Block)" 
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()} 
                  active={editor?.isActive('codeBlock') || false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="เส้นคั่นเนื้อหา (Horizontal Rule)" 
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()} 
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </ToolbarBtn>
                
                <div className="w-px h-6 bg-border mx-1 self-center"></div>
                
                {/* 4. Text Colors */}
                <ToolbarBtn 
                  title="ตัวอักษรสีแดง" 
                  onClick={() => editor?.chain().focus().setColor('#ef4444').run()} 
                  active={editor?.isActive('textStyle', { color: '#ef4444' }) || false}
                  style={{ color: '#ef4444' }}>
                  <span className="font-black text-sm">A</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ตัวอักษรสีน้ำเงิน" 
                  onClick={() => editor?.chain().focus().setColor('#3b82f6').run()} 
                  active={editor?.isActive('textStyle', { color: '#3b82f6' }) || false}
                  style={{ color: '#3b82f6' }}>
                  <span className="font-black text-sm">A</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ตัวอักษรสีเขียวมรกต" 
                  onClick={() => editor?.chain().focus().setColor('#10b981').run()} 
                  active={editor?.isActive('textStyle', { color: '#10b981' }) || false}
                  style={{ color: '#10b981' }}>
                  <span className="font-black text-sm">A</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ตัวอักษรสีม่วงลาเวนเดอร์" 
                  onClick={() => editor?.chain().focus().setColor('#8b5cf6').run()} 
                  active={editor?.isActive('textStyle', { color: '#8b5cf6' }) || false}
                  style={{ color: '#8b5cf6' }}>
                  <span className="font-black text-sm">A</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ล้างสีตัวอักษร" 
                  onClick={() => editor?.chain().focus().unsetColor().run()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M18.629 14.5a3.676 3.676 0 0 0 .5-1.5 4 4 0 1 0-7.317-1.98"/><path d="M11.5 11.5a4 4 0 0 0-4 4c0 1.222.556 2.302 1.414 3"/></svg>
                </ToolbarBtn>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                {/* 5. Highlight Colors */}
                <ToolbarBtn 
                  title="ไฮไลต์สีชมพูซากุระ" 
                  onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fecdd3' }).run()} 
                  active={editor?.isActive('highlight', { color: '#fecdd3' }) || false}
                  style={{ bgcolor: '#fecdd3', textcolor: '#9f1239' }}>
                   <span className="font-bold text-xs">H</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ไฮไลต์สีเขียวพาสเทล" 
                  onClick={() => editor?.chain().focus().toggleHighlight({ color: '#bbf7d0' }).run()} 
                  active={editor?.isActive('highlight', { color: '#bbf7d0' }) || false}
                  style={{ bgcolor: '#bbf7d0', textcolor: '#166534' }}>
                   <span className="font-bold text-xs">H</span>
                </ToolbarBtn>
                <ToolbarBtn 
                  title="ไฮไลต์สีเหลือง" 
                  onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} 
                  active={editor?.isActive('highlight', { color: '#fef08a' }) || false}
                  style={{ bgcolor: '#fef08a', textcolor: '#854d0e' }}>
                   <span className="font-bold text-xs">H</span>
                </ToolbarBtn>

                {/* 6. Media */}
                <button 
                  type="button"
                  onClick={openEditorImageUpload} 
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary hover:text-white transition-all text-xs cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>เพิ่มรูป</span>
                </button>
              </div>

              <div 
                className="tiptap-editor-admin p-6 min-h-[400px] bg-surface text-text cursor-text"
                onClick={() => editor?.commands.focus()}
              >
                {editor ? (
                  <EditorContent editor={editor} />
                ) : (
                  <div className="flex items-center justify-center min-h-[350px] text-text-muted gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังเตรียมพร้อมกล่องข้อความ...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Table of Contents (Outline Showcase) */}
          {showToc && (
            <aside className="lg:col-span-4 xl:col-span-3 w-full sticky top-24 space-y-3">
              <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold font-serif flex items-center justify-center shrink-0">
                      目
                    </span>
                    <span className="text-xs font-bold text-text uppercase tracking-wider">สารบัญสด (Outline)</span>
                  </div>
                  <span className="text-[11px] text-text-muted px-2 py-0.5 rounded-full bg-surface-subtle border border-border/50 font-medium">
                    {headings.length} หัวข้อ
                  </span>
                </div>

                {headings.length === 0 ? (
                  <div className="py-6 px-3 text-center text-xs text-text-muted space-y-2 bg-surface-subtle/50 rounded-xl border border-dashed border-border">
                    <p className="font-semibold text-text">ยังไม่มีหัวข้อ</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      ลองใช้ปุ่ม <strong className="text-primary font-bold">H1 - H4</strong> ในแถบเครื่องมือเพื่อสร้างหัวข้อ สารบัญจะอัปเดตแบบสดๆ ทันที!
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-1 space-y-1.5 scrollbar-none text-xs">
                    {headings.map((h) => {
                      const levelBadges: Record<number, { label: string; class: string }> = {
                        1: { label: 'H1', class: 'bg-primary text-white font-black text-[10px]' },
                        2: { label: 'H2', class: 'bg-primary/15 text-primary font-bold text-[10px]' },
                        3: { label: 'H3', class: 'bg-surface-subtle text-text-muted border border-border/50 text-[10px]' },
                        4: { label: 'H4', class: 'bg-surface-subtle text-text-subtle text-[9px]' },
                      };
                      const badge = levelBadges[h.level] || levelBadges[2];

                      let indent = '';
                      if (h.level === 2) indent = 'ml-2 border-l-2 border-primary/30 pl-2';
                      else if (h.level === 3) indent = 'ml-4 border-l-2 border-border/60 pl-2 text-text-muted';
                      else if (h.level === 4) indent = 'ml-6 border-l-2 border-border/30 pl-2 text-text-subtle text-[11px]';

                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => jumpToHeading(h.pos)}
                          className={`w-full text-left flex items-start gap-2 py-1.5 px-2 rounded-xl transition-all group hover:bg-surface-subtle cursor-pointer ${indent}`}
                          title={`คลิกเพื่อเลื่อนไปยังหัวข้อนี้ใน Editor: ${h.text}`}
                        >
                          <span className={`px-1.5 py-0.5 rounded shrink-0 leading-none ${badge.class}`}>
                            {badge.label}
                          </span>
                          <span className="flex-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors font-medium">
                            {h.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <button 
          type="button"
          onClick={savePost} 
          className="w-full sm:w-auto px-10 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-[0_4px_15px_rgba(188,56,56,0.25)] hover:-translate-y-0.5 hover:bg-secondary transition-all cursor-pointer"
        >
          {isEditing ? 'บันทึกการแก้ไข ✨' : 'Publish บันทึก 🏮'}
        </button>
        <div className="status-message flex items-center gap-2 text-text-muted text-sm font-medium">
          {status && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
          <span>{status}</span>
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ children, onClick, active, title, style = {} }: any) {
  return (
    <button 
      type="button"
      title={title}
      onClick={onClick} 
      className={`
        w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 text-sm font-bold
        ${active 
          ? 'bg-primary border-primary text-white shadow-[0_2px_8px_rgba(188,56,56,0.3)]' 
          : 'bg-surface border-border text-text hover:bg-surface-subtle hover:border-primary/40'}
      `}
      style={{ 
        backgroundColor: style.bgcolor || undefined,
        color: style.textcolor || style.color || undefined
      }}
    >
      {children}
    </button>
  )
}
