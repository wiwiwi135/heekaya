
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Story, AppSettings } from './types';
import { StorySetup } from './components/StorySetup';
import { ChatInterface } from './components/ChatInterface';
import { generateStoryMetadata } from './services/geminiService';
import { 
  PlusCircle, Settings, Upload, ShieldCheck, 
  Search, Moon, Sun, ChevronRight, Loader2, 
  Trash2, Info, Lock, Globe, FileUp, ShieldAlert,
  Heart, Share2, Sparkles, Clock
} from 'lucide-react';

declare const Swal: any;

const SYSTEM_STORIES: Story[] = [
  { id: 's1', title: 'نيو طوكيو 2099', emoji: '🏙️', summary: 'الذكاء الاصطناعي يحكم من خلف الستار في مدينة النيون والمؤامرات السايبربانك.', userName: 'المستكشف نيو', description: 'مدينة النيون والمؤامرات.', category: 'system', messages: [], createdAt: Date.now(), dialect: 'العربية الفصحى' },
  { id: 's2', title: 'مملكة الجليد', emoji: '❄️', summary: 'تنانين تحاصر آخر حصون البشر في شتاء أبدي ومعارك سحرية ملحمية.', userName: 'الفارس أرتور', description: 'برد قارس ومعركة ملحمية سحرية.', category: 'system', messages: [], createdAt: Date.now(), dialect: 'العربية الفصحى' },
  { id: 's3', title: 'لغز القطار السريع', emoji: '🚂', summary: 'جريمة غامضة على متن قطار يعبر جبال الألب، وكل الركاب مشتبه بهم.', userName: 'المحقق', description: 'جريمة غامضة وتحقيق بوليسي.', category: 'system', messages: [], createdAt: Date.now(), dialect: 'العربية الفصحى' },
  { id: 's4', title: 'أطلال الفراعنة', emoji: '🏺', summary: 'مستكشفون يبحثون عن مقبرة مفقودة في صحراء مصر يواجهون لعنة قديمة.', userName: 'عالم الآثار', description: 'مغامرة تاريخية ولعنات فرعونية.', category: 'system', messages: [], createdAt: Date.now(), dialect: 'العربية الفصحى' },
  { id: 's5', title: 'أكاديمية السحر', emoji: '✨', summary: 'طالب جديد يكتشف قوى مظلمة تهدد مدرسة السحرة العريقة.', userName: 'الطالب المبتدئ', description: 'مدرسة سحر وقوى خارقة.', category: 'system', messages: [], createdAt: Date.now(), dialect: 'العربية الفصحى' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOBBY);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('hekaya_settings_v5');
    return saved ? JSON.parse(saved) : { fontSize: 'medium', fontFamily: 'Vazirmatn', theme: 'dark', language: 'ar' };
  });

  const isAr = settings.language === 'ar';
  const t = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => {
    const saved = localStorage.getItem('hekaya_db_v5');
    if (saved) setStories(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('dir', settings.language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.style.fontFamily = `'${settings.fontFamily}', sans-serif`;
    localStorage.setItem('hekaya_settings_v5', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => { localStorage.setItem('hekaya_db_v5', JSON.stringify(stories)); }, [stories]);

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedStory: Story = JSON.parse(event.target?.result as string);
        if (!importedStory.id || !importedStory.title) throw new Error("Invalid structure");
        // Check if exists
        if (stories.some(s => s.id === importedStory.id)) {
           importedStory.id = Date.now().toString(); // avoid collision
        }
        setStories([importedStory, ...stories]);
        Swal.fire({ icon: 'success', title: t('تم الاستيراد', 'Imported'), toast: true, position: 'top-end', timer: 3000 });
      } catch (err) {
        Swal.fire({ icon: 'error', title: t('فشل الاستيراد', 'Import Failed'), text: t('الملف غير صالح', 'Invalid JSON file') });
      }
    };
    reader.readAsText(file);
  };

  const showPrivacyPolicy = () => {
    Swal.fire({
      title: t('سياسة الخصوصية والأمان', 'Privacy & Security'),
      html: `
        <div class="text-start text-sm space-y-4 max-h-72 overflow-y-auto custom-scroll p-4 bg-black/10 rounded-2xl leading-relaxed">
          <p><b>🔐 أمان مفاتيح الـ API:</b> يتم التعامل مع مفتاح الـ API الخاص بـ Gemini بشكل آمن وتلقائي عبر بيئة النظام. نحن لا نقوم بحفظه في قواعد بيانات خارجية أو كاش غير محمي.</p>
          <p><b>📁 التخزين المحلي:</b> جميع قصصك، تفضيلاتك، وكلمات السر الخاصة بك تُخزن حصرياً في متصفحك (LocalStorage). لا نملك أي وصول إلى محتواك الخاص.</p>
          <p><b>🛡️ الخصوصية:</b> لا يتم تتبع نشاطك أو جمع أي بيانات شخصية. "حكاية" هي منصة للإبداع الخاص والحر.</p>
          <p><b>✨ المحتوى الذكي:</b> نستخدم نماذج Gemini 3 المتقدمة لتوفير أفضل تجربة سرد، وتخضع المحادثات لسياسات الاستخدام الآمن للذكاء الاصطناعي.</p>
        </div>
      `,
      confirmButtonText: t('فهمت ذلك', 'I Understand'),
      background: settings.theme === 'dark' ? '#111' : '#fff',
      color: settings.theme === 'dark' ? '#fff' : '#000',
    });
  };

  const showTermsOfService = () => {
    Swal.fire({
      title: t('شروط الاستخدام (اتفاقية المستخدم)', 'Terms of Service'),
      html: `
        <div class="text-start text-sm space-y-4 max-h-72 overflow-y-auto custom-scroll p-4 bg-black/10 rounded-2xl leading-relaxed">
          <p><b>1. القبول:</b> باستخدامك منصة "حكاية"، أنت توافق على الالتزام بشروط الاستخدام الخاصة بالمنصة.</p>
          <p><b>2. الملكية الفكرية:</b> محتوى القصص المنشأة عبر الذكاء الاصطناعي ملك للمستخدم، ويمكن تداوله أو تصديره. لكن يجب عدم الإساءة لاستخدام المنصة لتوليد محتوى ضار.</p>
          <p><b>3. الاستخدام العادل:</b> المنصة مصممة للتسلية والخيال. يمنع استخدامها في إيذاء الآخرين أو بث الكراهية.</p>
          <p><b>4. إخلاء المسؤولية:</b> المنصة مقدمة "كما هي". القصص والردود مولدة آلياً وأي تشابه مع الواقع هو محض صدفة أو من خيال المستخدم.</p>
        </div>
      `,
      confirmButtonText: t('أوافق', 'I Agree'),
      background: settings.theme === 'dark' ? '#111' : '#fff',
      color: settings.theme === 'dark' ? '#fff' : '#000',
    });
  };

  const handleCreateStory = async (data: Partial<Story>) => {
    setState(AppState.GENERATING);
    try {
      const metadata = await generateStoryMetadata(data.userName!, data.description!);
      const newStory: Story = {
        id: Date.now().toString(),
        userName: data.userName!,
        description: data.description!,
        title: metadata.title,
        emoji: metadata.emoji,
        summary: metadata.summary,
        password: data.password || undefined,
        dialect: data.dialect || 'العربية الفصحى',
        messages: [],
        createdAt: Date.now(),
        category: 'user'
      };
      setStories([newStory, ...stories]);
      setCurrentStory(newStory);
      setState(AppState.CHAT);
    } catch (e) {
      Swal.fire({ icon: 'error', title: t('خطأ في الاتصال', 'Connection Error'), text: t('تحقق من مزود الخدمة', 'Check provider') });
      setState(AppState.SETUP);
    }
  };

  const StoryCard: React.FC<{ s: Story }> = ({ s }) => (
    <div className="card-wide vibrant-glass p-8 rounded-[2.5rem] flex flex-col justify-between group h-full relative cursor-pointer hover:border-purple-500/50 transition-all" 
         onClick={() => { setCurrentStory(s); setState(s.password ? AppState.AUTH : AppState.CHAT); }}>
      <div className="flex justify-between items-start mb-6">
        <span className="text-5xl p-4 bg-white/5 rounded-2xl shadow-inner transition-transform group-hover:scale-110">{s.emoji}</span>
        {s.category === 'user' && (
          <button onClick={(e) => { e.stopPropagation(); setStories(stories.filter(x => x.id !== s.id)); }} 
                  className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-5 h-5"/>
          </button>
        )}
      </div>
      <div>
        <h4 className="text-2xl font-black mb-2 leading-tight group-hover:text-purple-400 transition-colors">{s.title}</h4>
        <p className="text-sm opacity-50 line-clamp-2 mb-6 font-medium leading-relaxed">{s.summary}</p>
        <div className="flex gap-2 mt-4">
          <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-wider">{s.category}</div>
          <div className="px-3 py-1 bg-purple-500/10 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-wider">{s.dialect?.split(' ')[0] || 'الفصحى'}</div>
          {s.isLiked && <div className="px-3 py-1 bg-pink-500/10 rounded-full text-[9px] font-black text-pink-400 uppercase tracking-wider flex items-center gap-1"><Heart className="w-3 h-3 fill-current"/></div>}
          {s.isShared && <div className="px-3 py-1 bg-blue-500/10 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1"><Share2 className="w-3 h-3"/></div>}
        </div>
      </div>
    </div>
  );

  const getRecommendations = () => {
    const userStories = stories.filter(s => s.category === 'user');
    const incomplete = userStories.filter(s => s.messages.length > 0 && s.messages.length < 5);
    const likedOrShared = userStories.filter(s => s.isLiked || s.isShared);
    
    const keywords = new Set<string>();
    likedOrShared.forEach(s => {
      s.summary.split(' ').forEach(w => {
        if (w.length > 4) keywords.add(w);
      });
    });

    let recommendedSystem = SYSTEM_STORIES.filter(sys => {
      if (userStories.some(u => u.title === sys.title)) return false;
      if (keywords.size === 0) return true;
      const sysWords = sys.summary.split(' ');
      return sysWords.some(w => keywords.has(w));
    });

    if (recommendedSystem.length === 0) {
      recommendedSystem = SYSTEM_STORIES.filter(sys => !userStories.some(u => u.title === sys.title));
    }

    return {
      incomplete: incomplete.slice(0, 3),
      recommended: recommendedSystem.slice(0, 3)
    };
  };

  const { incomplete, recommended } = getRecommendations();

  return (
    <div className="min-h-screen p-6 md:p-16 no-print">
      {state === AppState.LOBBY && (
        <div className="max-w-7xl mx-auto space-y-20 animate-in fade-in duration-700">
          <header className="flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="text-center lg:text-start relative">
              <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent leading-[1.1]">حكاية</h1>
              <span className="absolute -top-4 -right-8 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg rotate-12">Production</span>
              <p className="text-white/20 font-bold uppercase tracking-[0.5em] text-[10px] mt-2">{t('المخيلة الرقمية في خدمتك', 'Digital Imagination At Service')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportJSON} />
              <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-emerald-400" title={t('استيراد JSON', 'Import JSON')}><FileUp className="w-6 h-6"/></button>
              <button onClick={() => setState(AppState.SETUP)} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black text-white shadow-xl shadow-purple-500/20 hover:scale-105 transition-all"><PlusCircle className="inline ml-2"/> {t('بدء حكاية', 'New Story')}</button>
              <button onClick={() => setState(AppState.SETTINGS)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10"><Settings className="w-6 h-6"/></button>
              <button onClick={showPrivacyPolicy} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-purple-400" title={t('الخصوصية', 'Privacy')}><ShieldAlert className="w-6 h-6"/></button>
            </div>
          </header>

          <main className="space-y-20">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="vibrant-glass p-6 rounded-3xl text-center">
                <div className="text-4xl font-black text-purple-400 mb-2">{stories.length}</div>
                <div className="text-xs font-bold opacity-50 uppercase tracking-widest">{t('إجمالي القصص', 'Total Stories')}</div>
              </div>
              <div className="vibrant-glass p-6 rounded-3xl text-center">
                <div className="text-4xl font-black text-pink-400 mb-2">{stories.reduce((acc, s) => acc + s.messages.length, 0)}</div>
                <div className="text-xs font-bold opacity-50 uppercase tracking-widest">{t('إجمالي التفاعلات', 'Total Interactions')}</div>
              </div>
              <div className="vibrant-glass p-6 rounded-3xl text-center">
                <div className="text-4xl font-black text-emerald-400 mb-2">{stories.reduce((acc, s) => acc + Object.keys(s.characters || {}).length, 0)}</div>
                <div className="text-xs font-bold opacity-50 uppercase tracking-widest">{t('شخصيات مصورة', 'Avatar Characters')}</div>
              </div>
              <div className="vibrant-glass p-6 rounded-3xl text-center">
                <div className="text-4xl font-black text-blue-400 mb-2">{stories.filter(s => s.category === 'user').length}</div>
                <div className="text-xs font-bold opacity-50 uppercase tracking-widest">{t('قصصك الخاصة', 'Personal Stories')}</div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><div className="w-1 h-8 bg-pink-500 rounded-full"></div> {t('توصيات مخصصة لك', 'Personalized Recommendations')}</h3>
              
              {incomplete.length > 0 && (
                <div className="mb-12">
                  <h4 className="text-sm font-black opacity-50 uppercase tracking-widest mb-6 flex items-center gap-2"><Clock className="w-4 h-4"/> {t('قصص بدأتها ولم تكملها', 'Started but incomplete')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {incomplete.map(s => <StoryCard key={s.id} s={s}/>)}
                  </div>
                </div>
              )}

              {recommended.length > 0 && (
                <div>
                  <h4 className="text-sm font-black opacity-50 uppercase tracking-widest mb-6 flex items-center gap-2"><Sparkles className="w-4 h-4"/> {t('بناءً على تفضيلاتك ومشاركاتك', 'Based on your likes and shares')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {recommended.map(s => <StoryCard key={s.id} s={s}/>)}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><div className="w-1 h-8 bg-blue-500 rounded-full"></div> {t('عوالم مقترحة', 'System Worlds')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {SYSTEM_STORIES.map(s => <StoryCard key={s.id} s={s}/>)}
              </div>
            </section>
            <section>
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><div className="w-1 h-8 bg-purple-500 rounded-full"></div> {t('أرشيفك الخاص', 'Personal Archive')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {stories.filter(s => s.category === 'user').length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-30 italic"><p>{t('لم تخلق أسطورتك بعد...', 'No legends created yet...')}</p></div>
                ) : stories.filter(s => s.category === 'user').map(s => <StoryCard key={s.id} s={s}/>)}
              </div>
            </section>
          </main>
        </div>
      )}

      {state === AppState.SETTINGS && (
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-10 duration-500">
          <div className="vibrant-glass p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-16">
              <h2 className="text-4xl font-black">{t('الإعدادات', 'Settings')}</h2>
              <button onClick={() => setState(AppState.LOBBY)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10"><ChevronRight className={isAr ? '' : 'rotate-180'}/></button>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <label className="text-xs font-black opacity-40 uppercase tracking-widest">{t('اللغة', 'Language')}</label>
                <div className="flex gap-2">
                  <button onClick={() => setSettings({...settings, language: 'ar'})} className={`flex-1 p-4 rounded-xl font-black border-2 transition-all ${settings.language === 'ar' ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/10 opacity-60'}`}>العربية</button>
                  <button onClick={() => setSettings({...settings, language: 'en'})} className={`flex-1 p-4 rounded-xl font-black border-2 transition-all ${settings.language === 'en' ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/10 opacity-60'}`}>English</button>
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-xs font-black opacity-40 uppercase tracking-widest">{t('المظهر', 'Theme')}</label>
                <div className="flex gap-2">
                  <button onClick={() => setSettings({...settings, theme: 'dark'})} className={`flex-1 p-4 rounded-xl font-black border-2 transition-all ${settings.theme === 'dark' ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/10 opacity-60'}`}><Moon className="inline ml-1 w-4 h-4"/> {t('مظلم', 'Dark')}</button>
                  <button onClick={() => setSettings({...settings, theme: 'light'})} className={`flex-1 p-4 rounded-xl font-black border-2 transition-all ${settings.theme === 'light' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 opacity-60'}`}><Sun className="inline ml-1 w-4 h-4"/> {t('فاتح', 'Light')}</button>
                </div>
              </div>
            </div>
            <div className="mt-12 p-8 bg-purple-500/5 border border-purple-500/20 rounded-3xl flex items-center gap-6 cursor-pointer hover:bg-purple-500/10 transition-all" onClick={showPrivacyPolicy}>
               <ShieldCheck className="w-12 h-12 text-purple-400 shrink-0"/>
               <div className="space-y-1">
                 <p className="text-sm font-bold">{t('نحن نحمي خصوصيتك', 'Your Privacy is Protected')}</p>
                 <p className="text-xs opacity-60 leading-relaxed">{t('يتم تشفير مفتاح الـ API والبيانات تلقائياً. اضغط لقراءة السياسة بالكامل.', 'API keys and data are encrypted. Click to read full policy.')}</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {state === AppState.SETUP && <StorySetup onStart={handleCreateStory} />}
      {state === AppState.CHAT && currentStory && <ChatInterface story={currentStory} settings={settings} onUpdate={(up) => { setCurrentStory(up); if(up.category === 'user') setStories(stories.map(s => s.id === up.id ? up : s)); }} onExit={() => setState(AppState.LOBBY)} />}
      {state === AppState.GENERATING && <div className="h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-500"><Loader2 className="w-24 h-24 text-purple-400 animate-spin"/><div className="text-center space-y-4"><p className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('تجسيد الأبعاد...', 'Manifesting Dimensions...')}</p><p className="text-white/20 font-black tracking-[0.5em] text-xs">{t('ننسج خيوط القدر الآن', 'Fate is being woven')}</p></div></div>}

      {/* Production Footer */}
      {state !== AppState.CHAT && state !== AppState.GENERATING && (
        <footer className="mt-20 pt-10 border-t border-white/10 text-center text-white/40 text-sm max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-center md:text-start">
             <p className="font-bold">© {new Date().getFullYear()} حكاية للذكاء الاصطناعي. {t('جميع الحقوق محفوظة.', 'All rights reserved.')}</p>
             <p className="text-[10px] mt-2 opacity-60 uppercase tracking-widest font-mono">v1.2.0 • Production Build</p>
           </div>
           <div className="flex flex-wrap justify-center gap-6 font-bold text-xs uppercase tracking-widest">
              <button onClick={showPrivacyPolicy} className="hover:text-purple-400 transition-colors">{t('سياسة الخصوصية', 'Privacy Policy')}</button>
              <button onClick={showTermsOfService} className="hover:text-pink-400 transition-colors">{t('شروط الاستخدام', 'Terms of Service')}</button>
           </div>
        </footer>
      )}
    </div>
  );
};

export default App;
