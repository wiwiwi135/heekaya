import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, LogOut, Loader2, BookOpen, 
  Copy, Eye, Volume2, MoreVertical, 
  Info, Map, Users, X, Languages, Wand2, FileText, 
  Printer, Type, Minus, Plus, ChevronDown, Download, Heart, Share2
} from 'lucide-react';
import { Story, StoryMessage, AppSettings } from '../types';
import { generateStoryResponse, summarizeStoryArc, generateCharacterAvatar, generateAvatarPrompt } from '../services/geminiService';

declare const Swal: any;

const DIALECTS = [
  { label: 'الفصحى', value: 'العربية الفصحى' },
  { label: 'مصرية', value: 'اللهجة المصرية العامية' },
  { label: 'سعودية', value: 'اللهجة السعودية العامية' },
  { label: 'English', value: 'English Language' },
];

interface ChatInterfaceProps {
  story: Story;
  settings: AppSettings;
  onUpdate: (story: Story) => void;
  onExit: () => void;
}

const getCharacterColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ story, settings, onUpdate, onExit }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [dialect, setDialect] = useState(story.dialect || 'العربية الفصحى');
  const [readingMode, setReadingMode] = useState(false);
  const [generatingAvatarFor, setGeneratingAvatarFor] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  // Avatar Prompt Modal State
  const [avatarPromptModal, setAvatarPromptModal] = useState(false);
  const [currentAvatarPrompt, setCurrentAvatarPrompt] = useState('');
  const [avatarCharacterTarget, setAvatarCharacterTarget] = useState('');
  
  // Image Viewer State
  const [viewingImage, setViewingImage] = useState<{url: string, name: string} | null>(null);
  
  // Typography State
  const [chatFontSize, setChatFontSize] = useState(18);
  const [chatFontFamily, setChatFontFamily] = useState('sans-serif');

  const scrollRef = useRef<HTMLDivElement>(null);

  const isAr = settings.language === 'ar';
  const t = (ar: string, en: string) => isAr ? ar : en;

  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
  };

  useEffect(() => {
    scrollToBottom();
  }, [story.messages.length]);

  const handleGenerateAvatar = async (characterName: string) => {
    if (generatingAvatarFor) return;
    setGeneratingAvatarFor(characterName);
    try {
      const context = story.messages.slice(-5).map(m => m.narratorText || m.userText).join(' ');
      const prompt = await generateAvatarPrompt(characterName, context);
      setCurrentAvatarPrompt(prompt);
      setAvatarCharacterTarget(characterName);
      setAvatarPromptModal(true);
    } catch (e) {
      console.error(e);
      Swal.fire('Error', t('فشل توليد الوصف', 'Failed to generate prompt'), 'error');
    } finally {
      setGeneratingAvatarFor(null);
    }
  };

  const confirmGenerateAvatar = async () => {
    if (!avatarCharacterTarget || !currentAvatarPrompt) return;
    setAvatarPromptModal(false);
    setGeneratingAvatarFor(avatarCharacterTarget);
    try {
      const avatarDataUrl = await generateCharacterAvatar(currentAvatarPrompt);
      if (avatarDataUrl) {
        onUpdate({
          ...story,
          characters: {
            ...(story.characters || {}),
            [avatarCharacterTarget]: avatarDataUrl
          }
        });
      } else {
        Swal.fire('Error', t('فشل توليد الصورة', 'Failed to generate image'), 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', t('فشل توليد الصورة', 'Failed to generate image'), 'error');
    } finally {
      setGeneratingAvatarFor(null);
      setAvatarCharacterTarget('');
      setCurrentAvatarPrompt('');
    }
  };

  const handleSpeakTurn = (msg: StoryMessage) => {
    speechSynthesis.cancel();
    let text = (msg.narratorText || "") + ". " + (msg.characterDialogues?.map(c => `${c.name}: ${c.text}`).join(". ") || "");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = dialect.includes('English') ? 'en-US' : 'ar-SA';
    speechSynthesis.speak(u);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: StoryMessage = { id: Date.now().toString(), role: 'user', userText: text, timestamp: Date.now() };
    const newMessages = [...story.messages, userMsg];
    onUpdate({ ...story, messages: newMessages });
    setInput('');
    setLoading(true);
    setTimeout(scrollToBottom, 50);

    try {
      const history = story.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.userText || m.narratorText || '' }]
      }));
      const result = await generateStoryResponse(text, history, story.userName, story.description, dialect);
      const aiMsg: StoryMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        narratorText: result.narratorText,
        characterDialogues: result.characterDialogues,
        suggestions: result.suggestions,
        timestamp: Date.now(),
      };
      onUpdate({ ...story, messages: [...newMessages, aiMsg] });
    } catch (e: any) {
      Swal.fire('Error', t('خلل في السرد', 'Story Error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = () => {
    onUpdate({ ...story, isLiked: !story.isLiked });
    if (!story.isLiked) {
      Swal.fire({ icon: 'success', title: t('تمت الإضافة للمفضلة', 'Added to favorites'), toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#111', color: '#fff' });
    }
  };

  const handleShare = () => {
    onUpdate({ ...story, isShared: true });
    navigator.clipboard.writeText(`اقرأ قصتي "${story.title}" على منصة حكاية!`);
    Swal.fire({ icon: 'success', title: t('تم نسخ رابط المشاركة', 'Share link copied'), toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#111', color: '#fff' });
  };

  const toolFunctions = [
    { icon: <BookOpen className="w-4 h-4 text-emerald-400"/>, label: t('تصدير ككتاب تفاعلي (HTML)', 'Export as Interactive Book (HTML)'), action: () => {
        const htmlContent = `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${story.title}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    :root { --bg: #fdfbf7; --text: #1a1a1a; --accent: #8b5cf6; }
    body { font-family: 'Amiri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #e5e5e5; color: var(--text); display: flex; justify-content: center; align-items: center; min-height: 100vh; flex-direction: column; }
    .controls { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }
    button { padding: 10px 20px; cursor: pointer; background: var(--accent); color: white; border: none; border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.2s; }
    button:hover { opacity: 0.9; }
    .book-container { width: 100%; max-width: 800px; height: 90vh; background: white; box-shadow: 0 20px 50px rgba(0,0,0,0.2); position: relative; overflow: hidden; margin: 20px; border-radius: 8px; }
    .page { width: 100%; height: 100%; position: absolute; top: 0; left: 0; padding: 60px; box-sizing: border-box; background: white; transition: transform 0.5s ease-in-out, opacity 0.5s; opacity: 0; pointer-events: none; overflow-y: auto; }
    .page.active { opacity: 1; pointer-events: all; }
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #1e1b4b, #4c1d95); color: white; }
    .cover h1 { font-size: 3.5em; margin-bottom: 20px; line-height: 1.2; }
    .cover .emoji { font-size: 5em; margin-bottom: 20px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 50%; }
    .cover .author { font-size: 1.2em; opacity: 0.8; margin-top: 40px; }
    .content-page { font-size: 1.2em; line-height: 2; }
    .narrator { margin-bottom: 20px; text-align: justify; }
    .dialogue { margin: 15px 0 15px 40px; font-style: italic; color: #333; border-right: 3px solid var(--accent); padding-right: 15px; }
    .character-name { font-weight: bold; font-style: normal; color: #000; }
    .page-nav { position: absolute; bottom: 20px; width: 100%; display: flex; justify-content: space-between; padding: 0 60px; box-sizing: border-box; left: 0; }
    .page-nav button { background: #f3f4f6; color: #333; }
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
    
    @media print {
      body { background: white; display: block; height: auto; }
      .controls, .page-nav { display: none !important; }
      .book-container { width: 100%; height: auto; box-shadow: none; margin: 0; overflow: visible; }
      .page { position: relative; display: block; height: auto; opacity: 1; page-break-after: always; overflow: visible; pointer-events: all; }
      .cover { height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button onclick="downloadPDF()">تحويل إلى PDF</button>
    <button onclick="window.print()">طباعة</button>
  </div>
  <div class="book-container" id="book">
    <div class="page cover active" id="page-0">
      <div class="emoji">${story.emoji}</div>
      <h1>${story.title}</h1>
      <div class="author">تأليف: ${story.userName}</div>
      <div class="page-nav" style="justify-content: flex-end;">
        <button onclick="nextPage()">ابدأ القراءة ➔</button>
      </div>
    </div>
    <div class="page content-page" id="page-1">
      ${story.messages.map(m => {
        if (m.role !== 'assistant') return '';
        let html = '';
        if (m.narratorText) html += '<p class="narrator">' + m.narratorText + '</p>';
        if (m.characterDialogues) {
          m.characterDialogues.forEach(c => {
            html += '<p class="dialogue"><span class="character-name">' + c.name + ':</span> ' + c.text + '</p>';
          });
        }
        return html;
      }).join('')}
      <div class="page-nav" style="justify-content: flex-start;">
        <button onclick="prevPage()">⬅ الغلاف</button>
      </div>
    </div>
  </div>

  <script>
    let currentPage = 0;
    const totalPages = 2;
    function showPage(index) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + index).classList.add('active');
    }
    function nextPage() { if(currentPage < totalPages - 1) { currentPage++; showPage(currentPage); } }
    function prevPage() { if(currentPage > 0) { currentPage--; showPage(currentPage); } }
    
    function downloadPDF() {
      document.querySelectorAll('.page').forEach(p => {
        p.style.opacity = '1';
        p.style.position = 'relative';
        p.style.height = 'auto';
      });
      document.querySelector('.controls').style.display = 'none';
      document.querySelectorAll('.page-nav').forEach(n => n.style.display = 'none');
      
      const element = document.getElementById('book');
      const opt = {
        margin:       10,
        filename:     '${story.title}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        document.querySelectorAll('.page').forEach(p => {
          p.style.opacity = '';
          p.style.position = '';
          p.style.height = '';
        });
        document.querySelector('.controls').style.display = 'flex';
        document.querySelectorAll('.page-nav').forEach(n => n.style.display = 'flex');
        showPage(currentPage);
      });
    }
  </script>
</body>
</html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${story.title}.html`; a.click();
    }},
    { icon: <Printer className="w-4 h-4 text-emerald-400"/>, label: t('تصدير كرواية (PDF)', 'Export as Novel'), action: () => {
        window.print();
    }},
    { icon: <FileText className="w-4 h-4 text-yellow-400"/>, label: t('تصدير JSON', 'Export JSON'), action: () => {
        const blob = new Blob([JSON.stringify(story, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${story.title}.json`; a.click();
    }},
    { icon: <FileText className="w-4 h-4 text-blue-400"/>, label: t('تصدير كنص (TXT)', 'Export as Text (TXT)'), action: () => {
        let textContent = `${story.title}\n\n`;
        story.messages.forEach(m => {
          if (m.role === 'assistant') {
            if (m.narratorText) textContent += `[الراوي]: ${m.narratorText}\n\n`;
            if (m.characterDialogues) {
              m.characterDialogues.forEach(c => {
                textContent += `${c.name}: ${c.text}\n\n`;
              });
            }
          }
        });
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${story.title}.txt`; a.click();
    }},
    { icon: <BookOpen className="w-4 h-4 text-purple-400"/>, label: t('تصدير كماركداون (MD)', 'Export as Markdown (MD)'), action: () => {
        let mdContent = `# ${story.title}\n\n`;
        story.messages.forEach(m => {
          if (m.role === 'assistant') {
            if (m.narratorText) mdContent += `> ${m.narratorText}\n\n`;
            if (m.characterDialogues) {
              m.characterDialogues.forEach(c => {
                mdContent += `**${c.name}**: ${c.text}\n\n`;
              });
            }
          }
        });
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${story.title}.md`; a.click();
    }},
    { icon: <Copy className="w-4 h-4 text-white"/>, label: t('نسخ القصة', 'Copy Story'), action: () => {
        let textContent = `${story.title}\n\n`;
        story.messages.forEach(m => {
          if (m.role === 'assistant') {
            if (m.narratorText) textContent += `[الراوي]: ${m.narratorText}\n\n`;
            if (m.characterDialogues) {
              m.characterDialogues.forEach(c => {
                textContent += `${c.name}: ${c.text}\n\n`;
              });
            }
          }
        });
        navigator.clipboard.writeText(textContent);
        Swal.fire({ icon: 'success', title: t('تم النسخ', 'Copied'), toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#111', color: '#fff' });
    }}
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col md:flex-row overflow-hidden font-sans text-white no-print">
      
      {/* Sidebar (Desktop only) */}
      <div className="hidden lg:flex w-80 flex-col border-r border-white/10 bg-[#111] shrink-0 overflow-y-auto custom-scroll p-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 bg-white/5 inline-block p-4 rounded-3xl shadow-inner">{story.emoji}</div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{story.title}</h2>
          <p className="text-xs text-white/50 mt-2 uppercase tracking-widest font-black">{story.category}</p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4"/> {t('عن القصة', 'About Story')}</h3>
            <p className="text-sm text-white/80 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl">{story.summary}</p>
          </div>

          <div>
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> {t('الشخصيات', 'Characters')}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(story.characters || {}).length > 0 ? (
                Object.entries(story.characters || {}).map(([name, img]) => (
                  <div key={name} className="relative group cursor-pointer" title={name} onClick={() => setViewingImage({url: img, name})}>
                    <img src={img} alt={name} className="w-16 h-16 rounded-xl object-cover border border-white/20 hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity text-[10px] font-black text-center p-1">{name}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30 italic">{t('لا توجد شخصيات مصورة بعد', 'No character avatars yet')}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2"><Map className="w-4 h-4"/> {t('العالم', 'World')}</h3>
            <p className="text-xs text-white/60 leading-relaxed bg-white/5 p-4 rounded-2xl border-l-2 border-purple-500">{story.description}</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-[#0a0a0a]">
        
        {/* Novel Mode View (Hidden in UI, Shown in Print) */}
        <div className="hidden novel-page">
          <h1 className="novel-title">{story.title}</h1>
          {story.messages.map((m, i) => m.role === 'assistant' && (
            <div key={i}>
              {m.narratorText && <p className="narrator-text">{m.narratorText}</p>}
              {m.characterDialogues?.map((c, ci) => (
                <p key={ci} className="character-dialogue"><strong>{c.name}:</strong> {c.text}</p>
              ))}
            </div>
          ))}
        </div>

        {readingMode && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl p-10 overflow-y-auto animate-in fade-in">
            <button onClick={() => setReadingMode(false)} className="fixed top-8 left-8 p-4 bg-white/10 rounded-full hover:bg-white/20"><X className="w-8 h-8 text-white"/></button>
            <div className="max-w-3xl mx-auto space-y-10 py-20 text-white/90" style={{ fontSize: `${chatFontSize + 4}px`, fontFamily: chatFontFamily }}>
              <h1 className="text-5xl font-black text-center mb-20" style={{ fontFamily: 'sans-serif' }}>{story.emoji} {story.title}</h1>
              {story.messages.map((m, i) => (
                <div key={i} className="leading-relaxed border-b border-white/5 pb-10">
                  {m.userText && <p className="text-sm text-purple-400 italic mb-4" style={{ fontFamily: 'sans-serif' }}>-- {m.userText}</p>}
                  {m.narratorText && <p>{m.narratorText}</p>}
                  {m.characterDialogues?.map((c, ci) => (<p key={ci} className="mt-6 text-purple-300"><b>{c.name}:</b> {c.text}</p>))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-[#111] flex items-center justify-between px-4 shrink-0 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{story.emoji}</div>
            <h2 className="font-black text-lg hidden sm:block">{story.title}</h2>
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg ml-2">
               <Languages className="w-4 h-4 text-purple-400"/>
               <select value={dialect} onChange={(e) => setDialect(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer">
                  {DIALECTS.map(d => <option key={d.value} value={d.value} className="bg-black text-white">{d.label}</option>)}
               </select>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Typography Controls */}
            <div className="relative">
              <button onClick={() => { setTypographyOpen(!typographyOpen); setToolsOpen(false); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-colors" title={t('الخط والمظهر', 'Typography')}>
                <Type className="w-5 h-5"/>
              </button>
              {typographyOpen && (
                <div className="absolute top-12 left-0 sm:right-0 sm:left-auto w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-top-2">
                  <h4 className="text-xs font-bold text-white/50 mb-3 uppercase">{t('حجم الخط', 'Font Size')}</h4>
                  <div className="flex items-center gap-4 mb-6 bg-black/50 p-2 rounded-lg">
                    <button onClick={() => setChatFontSize(Math.max(12, chatFontSize - 2))} className="p-2 bg-white/10 rounded hover:bg-white/20"><Minus className="w-4 h-4"/></button>
                    <span className="flex-1 text-center font-mono">{chatFontSize}px</span>
                    <button onClick={() => setChatFontSize(Math.min(32, chatFontSize + 2))} className="p-2 bg-white/10 rounded hover:bg-white/20"><Plus className="w-4 h-4"/></button>
                  </div>
                  <h4 className="text-xs font-bold text-white/50 mb-3 uppercase">{t('نوع الخط', 'Font Family')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setChatFontFamily('sans-serif')} className={`p-2 rounded-lg text-sm font-bold transition-colors ${chatFontFamily === 'sans-serif' ? 'bg-purple-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}>{t('عصري', 'Sans')}</button>
                    <button onClick={() => setChatFontFamily('serif')} className={`p-2 rounded-lg text-sm font-bold transition-colors ${chatFontFamily === 'serif' ? 'bg-purple-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}>{t('تقليدي', 'Serif')}</button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleToggleLike} className={`p-2 rounded-lg transition-colors ${story.isLiked ? 'bg-pink-500/20 text-pink-500' : 'bg-white/5 hover:bg-white/10 text-pink-400'}`} title={t('إعجاب', 'Like')}>
              <Heart className={`w-5 h-5 ${story.isLiked ? 'fill-current' : ''}`}/>
            </button>
            <button onClick={handleShare} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-colors" title={t('مشاركة', 'Share')}>
              <Share2 className="w-5 h-5"/>
            </button>
            <button onClick={() => setReadingMode(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors" title={t('وضع القراءة', 'Read Mode')}><Eye className="w-5 h-5"/></button>
            
            <div className="relative">
              <button onClick={() => { setToolsOpen(!toolsOpen); setTypographyOpen(false); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-purple-400 transition-colors"><MoreVertical className="w-5 h-5"/></button>
              {toolsOpen && (
                <div className="absolute top-12 left-0 sm:right-0 sm:left-auto w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in slide-in-from-top-2">
                  {toolFunctions.map((tool, idx) => (
                    <button key={idx} onClick={() => { tool.action(); setToolsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-start transition-colors">
                      {tool.icon} <span className="font-bold">{tool.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button onClick={onExit} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title={t('خروج', 'Exit')}><LogOut className="w-5 h-5"/></button>
          </div>
        </header>

        {/* Narrative Area */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scroll scroll-smooth" style={{ fontSize: `${chatFontSize}px`, fontFamily: chatFontFamily }}>
          {story.messages.map((msg, index) => (
            <div key={msg.id} className="animate-in slide-in-from-bottom-4 max-w-4xl mx-auto">
              {msg.role === 'user' ? (
                <div className="flex justify-end items-start mb-8">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 px-6 py-4 rounded-2xl rounded-tr-none max-w-[85%] shadow-lg font-bold text-white" style={{ fontFamily: 'sans-serif', fontSize: '1rem' }}>
                    {msg.userText}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {msg.narratorText && (
                    <div className="bg-[#111] border-r-4 border-purple-500 p-6 sm:p-8 rounded-2xl shadow-lg relative group/narrator">
                      <span className="text-[10px] font-black text-purple-500/80 mb-4 block uppercase tracking-widest" style={{ fontFamily: 'sans-serif' }}>{t('الراوي', 'NARRATOR')}</span>
                      <p className="leading-relaxed text-white/90">{msg.narratorText}</p>
                      <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover/narrator:opacity-100 transition-opacity">
                        <button onClick={() => handleSpeakTurn(msg)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"><Volume2 className="w-4 h-4"/></button>
                        <button onClick={() => navigator.clipboard.writeText(msg.narratorText!)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"><Copy className="w-4 h-4"/></button>
                      </div>
                    </div>
                  )}
                  
                  {msg.characterDialogues?.map((char, i) => {
                    const color = getCharacterColor(char.name);
                    const avatarUrl = story.characters?.[char.name];
                    
                    return (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="relative group/avatar shrink-0 mt-2">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={char.name} onClick={() => setViewingImage({url: avatarUrl, name: char.name})} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg border-2 cursor-pointer hover:opacity-80 transition-opacity" style={{ borderColor: color }} />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center font-black text-black shadow-lg border-2 text-2xl" style={{ backgroundColor: color, borderColor: color, fontFamily: 'sans-serif' }}>{char.name[0]}</div>
                          )}
                          {!avatarUrl && (
                            <button 
                              onClick={() => handleGenerateAvatar(char.name)}
                              disabled={generatingAvatarFor === char.name}
                              className="absolute -bottom-2 -right-2 p-1.5 bg-black border border-white/20 rounded-full hover:bg-white/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity disabled:opacity-50"
                              title={t('توليد صورة', 'Generate Avatar')}
                            >
                              {generatingAvatarFor === char.name ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" /> : <Wand2 className="w-3 h-3 text-purple-400" />}
                            </button>
                          )}
                        </div>
                        <div className="p-5 sm:p-6 rounded-2xl rounded-tl-none max-w-[90%] shadow-lg border-l-2" style={{ backgroundColor: `${color}10`, borderLeftColor: color }}>
                          <div className="font-black text-[11px] mb-2 uppercase tracking-wider" style={{ color: color, fontFamily: 'sans-serif' }}>{char.name}</div>
                          <p className="leading-relaxed font-medium text-white/90">{char.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {msg.suggestions && (
                    <div className="flex flex-col gap-3 pt-4">
                      <span className="text-[10px] font-black opacity-40 uppercase tracking-widest px-2" style={{ fontFamily: 'sans-serif' }}>{t('دروب مقدرة', 'DESTINIES')}</span>
                      <div className="grid gap-2">
                        {msg.suggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSendMessage(s)} disabled={loading} className="text-start p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors text-sm sm:text-base" style={{ fontFamily: 'sans-serif' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 items-center px-4 py-8 animate-pulse justify-center">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin"/>
              <span className="text-purple-400 font-black text-sm uppercase tracking-widest" style={{ fontFamily: 'sans-serif' }}>{t('تجلّي الأبعاد...', 'Manifesting...')}</span>
            </div>
          )}
        </div>

        {/* Floating Scroll Button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 p-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-full shadow-2xl backdrop-blur-md transition-all z-20 animate-in fade-in slide-in-from-bottom-4"
            title={t('النزول للأسفل', 'Scroll to bottom')}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        )}

        {/* Input Area */}
        <div className="p-4 bg-[#111] border-t border-white/10 shrink-0 z-10">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex gap-3 max-w-4xl mx-auto items-center">
            <input 
              type="text" 
              className="flex-1 px-5 py-4 bg-black/50 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 font-bold text-white placeholder-white/30 transition-all" 
              placeholder={t("ما هو رد فعل بطلنا؟", "What is the hero response?")} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              disabled={loading} 
              style={{ fontFamily: 'sans-serif' }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className={isAr ? 'rotate-180 w-6 h-6' : 'w-6 h-6'}/>
            </button>
          </form>
        </div>

      </div>

      {/* Avatar Prompt Modal */}
      {avatarPromptModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-400" />
                {t('وصف الشخصية', 'Character Prompt')} - {avatarCharacterTarget}
              </h3>
              <button onClick={() => setAvatarPromptModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-4">
              {t('هذا هو الوصف الذي استنتجه الذكاء الاصطناعي من سياق القصة. يمكنك تعديله قبل توليد الصورة للحصول على نتائج أدق.', 'This is the prompt inferred by AI. You can edit it before generating the image for better results.')}
            </p>
            <textarea
              className="w-full h-40 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:ring-2 focus:ring-purple-500/50 outline-none resize-none mb-6"
              value={currentAvatarPrompt}
              onChange={(e) => setCurrentAvatarPrompt(e.target.value)}
              dir="ltr"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setAvatarPromptModal(false)} className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors">
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={confirmGenerateAvatar} className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                {t('توليد الصورة', 'Generate Image')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-16 right-0 flex gap-4">
              <button onClick={() => {
                const a = document.createElement('a');
                a.href = viewingImage.url;
                a.download = `${viewingImage.name}.png`;
                a.click();
              }} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title={t('تنزيل', 'Download')}>
                <Download className="w-6 h-6" />
              </button>
              <button onClick={() => setViewingImage(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title={t('إغلاق', 'Close')}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <img src={viewingImage.url} alt={viewingImage.name} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
            <h3 className="text-3xl font-black text-white mt-6 bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">{viewingImage.name}</h3>
          </div>
        </div>
      )}

    </div>
  );
};
