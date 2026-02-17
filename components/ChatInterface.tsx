
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, LogOut, Loader2, Sparkles, Trash2, Download, Share2, BookOpen, 
  ChevronDown, Copy, Eye, Volume2, MoreVertical, Bookmark, Clock, 
  Zap, Info, Map, Camera, Users, X, Languages, Wand2, FileText, 
  BrainCircuit, MessageSquareCode, Ghost, Flame, ScrollText, 
  Compass, History, Clapperboard, Puzzle, Printer
} from 'lucide-react';
import { Story, StoryMessage, AppSettings } from '../types';
import { generateStoryResponse, summarizeStoryArc } from '../services/geminiService';

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
  onUpdate: (messages: StoryMessage[]) => void;
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [dialect, setDialect] = useState(story.dialect || 'العربية الفصحى');
  const [readingMode, setReadingMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAr = settings.language === 'ar';
  const t = (ar: string, en: string) => isAr ? ar : en;

  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });

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
    onUpdate(newMessages);
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
      onUpdate([...newMessages, aiMsg]);
    } catch (e: any) {
      Swal.fire('Error', t('خلل في السرد', 'Story Error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const toolFunctions = [
    { icon: <Printer className="w-4 h-4 text-emerald-400"/>, label: t('تصدير كرواية (PDF)', 'Export as Novel'), action: () => {
        window.print();
    }},
    { icon: <FileText className="w-4 h-4 text-yellow-400"/>, label: t('تصدير JSON', 'Export JSON'), action: () => {
        const blob = new Blob([JSON.stringify(story, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${story.title}.json`; a.click();
    }},
    { icon: <Clapperboard className="w-4 h-4 text-purple-400"/>, label: t('تحويل لسيناريو', 'Script Mode'), action: () => handleSendMessage(t('أعد صياغة المشهد الأخير كسيناريو سينمائي', 'Rewrite as script')) },
    { icon: <Puzzle className="w-4 h-4 text-pink-400"/>, label: t('زرع لغز', 'Plant Mystery'), action: () => handleSendMessage(t('ازرع لغزاً غامضاً في المشهد', 'Plant mystery')) },
    { icon: <Compass className="w-4 h-4 text-blue-400"/>, label: t('البوصلة الأخلاقية', 'Moral Compass'), action: () => handleSendMessage(t('حلل أخلاقيات البطل', 'Analyze morals')) },
    { icon: <History className="w-4 h-4 text-orange-400"/>, label: t('تطور الشخصية', 'Character Arc'), action: () => handleSendMessage(t('لخص تطور الشخصية', 'Summarize arc')) },
  ];

  return (
    <div className="flex flex-col h-[94vh] max-w-6xl mx-auto vibrant-glass rounded-[3rem] shadow-2xl overflow-hidden relative no-print">
      
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
          <div className="max-w-3xl mx-auto space-y-10 py-20 text-white/90">
            <h1 className="text-6xl font-black text-center mb-20">{story.emoji} {story.title}</h1>
            {story.messages.map((m, i) => (
              <div key={i} className="text-2xl leading-relaxed border-b border-white/5 pb-10">
                {m.userText && <p className="text-sm text-purple-400 italic mb-4">-- {m.userText}</p>}
                {m.narratorText && <p>{m.narratorText}</p>}
                {m.characterDialogues?.map((c, ci) => (<p key={ci} className="mt-6 text-purple-300"><b>{c.name}:</b> {c.text}</p>))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/10 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="text-3xl bg-white/10 p-2 rounded-xl">{story.emoji}</div>
          <h2 className="font-black text-lg">{story.title}</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl">
             <Languages className="w-4 h-4 text-purple-400"/>
             <select value={dialect} onChange={(e) => setDialect(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none">
                {DIALECTS.map(d => <option key={d.value} value={d.value} className="bg-black text-white">{d.label}</option>)}
             </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setReadingMode(true)} className="p-2.5 bg-white/5 rounded-xl text-emerald-400" title={t('وضع القراءة', 'Read Mode')}><Eye className="w-5 h-5"/></button>
          <div className="relative">
            <button onClick={() => setToolsOpen(!toolsOpen)} className="p-2.5 bg-white/5 rounded-xl text-purple-400"><MoreVertical className="w-5 h-5"/></button>
            {toolsOpen && (
              <div className="absolute top-12 left-0 w-64 bg-black/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-top-2">
                {toolFunctions.map((tool, idx) => (
                  <button key={idx} onClick={() => { tool.action(); setToolsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl text-xs text-start">
                    {tool.icon} <span className="font-bold">{tool.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onExit} className="p-2.5 bg-white/5 rounded-xl text-red-400"><LogOut className="w-5 h-5"/></button>
        </div>
      </div>

      {/* Narrative Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-12 custom-scroll scroll-smooth">
        {story.messages.map((msg, index) => (
          <div key={msg.id} className="animate-in slide-in-from-bottom-4">
            {msg.role === 'user' ? (
              <div className="flex justify-end items-start"><div className="bg-gradient-to-br from-purple-600 to-pink-600 px-6 py-4 rounded-3xl rounded-tr-none max-w-[85%] shadow-xl font-bold text-white">{msg.userText}</div></div>
            ) : (
              <div className="space-y-10">
                {msg.narratorText && (
                  <div className="narrator-bubble border-r-4 border-purple-500/50 p-8 rounded-3xl leading-loose shadow-xl relative group/narrator">
                    <span className="text-[10px] font-black text-purple-500/80 mb-4 block uppercase">{t('الراوي', 'NARRATOR')}</span>
                    <p>{msg.narratorText}</p>
                    <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover/narrator:opacity-100 transition-all">
                      <button onClick={() => handleSpeakTurn(msg)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20"><Volume2 className="w-4 h-4"/></button>
                      <button onClick={() => navigator.clipboard.writeText(msg.narratorText!)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20"><Copy className="w-4 h-4"/></button>
                    </div>
                  </div>
                )}
                {msg.characterDialogues?.map((char, i) => {
                  const color = getCharacterColor(char.name);
                  return (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-black" style={{ backgroundColor: color }}>{char.name[0]}</div>
                      <div className="p-5 rounded-2xl rounded-tl-none max-w-[90%] shadow-xl border-l-2" style={{ backgroundColor: `${color}10`, borderLeftColor: color }}>
                        <div className="font-black text-[10px] mb-1 uppercase" style={{ color: color }}>{char.name}</div>
                        <p className="leading-relaxed font-medium">{char.text}</p>
                      </div>
                    </div>
                  );
                })}
                {msg.suggestions && (
                  <div className="flex flex-col gap-3 pt-6">
                    <span className="text-[9px] font-black opacity-30 uppercase tracking-widest px-2">{t('دروب مقدرة', 'DESTINIES')}</span>
                    {msg.suggestions.map((s, i) => (<button key={i} onClick={() => handleSendMessage(s)} disabled={loading} className="text-start p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl font-bold transition-all">{s}</button>))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="flex gap-4 items-center px-4 animate-pulse"><Loader2 className="w-5 h-5 text-purple-400 animate-spin"/><span className="text-purple-400 font-black text-xs uppercase">{t('تجلّي الأبعاد...', 'Manifesting...')}</span></div>}
      </div>

      {/* Input */}
      <div className="p-5 bg-white/5 border-t border-white/10 backdrop-blur-xl shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex gap-4 max-w-5xl mx-auto items-center">
          <input type="text" className="flex-1 px-6 py-4 app-input border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/30 font-bold" placeholder={t("ما هو رد فعل بطلنا؟", "What is the hero response?")} value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-2xl shadow-xl hover:scale-105 transition-all"><Send className={isAr ? 'rotate-180' : ''}/></button>
        </form>
      </div>
    </div>
  );
};
