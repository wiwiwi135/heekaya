
import React, { useState } from 'react';
import { BookOpen, User, Lock, ArrowRight, Languages } from 'lucide-react';
import { Story } from '../types';

interface StorySetupProps {
  onStart: (story: Partial<Story>) => void;
}

const DIALECTS = [
  { label: 'العربية الفصحى', value: 'العربية الفصحى' },
  { label: 'اللهجة المصرية', value: 'اللهجة المصرية العامية' },
  { label: 'اللهجة السعودية', value: 'اللهجة السعودية العامية' },
  { label: 'اللغة الإنجليزية', value: 'English Language' },
];

export const StorySetup: React.FC<StorySetupProps> = ({ onStart }) => {
  const [userName, setUserName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [dialect, setDialect] = useState(DIALECTS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !description) return;
    onStart({ userName, description, password, dialect });
  };

  return (
    <div className="max-w-md w-full mx-auto vibrant-glass p-10 rounded-3xl shadow-2xl border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-1"></div>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">ميثاق البداية</h1>
        <p className="text-gray-400 text-sm">حدد ملامح عالمك الجديد ودعه ينبض بالحياة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">اسم البطل / الكيان</label>
          <div className="relative">
            <User className="absolute right-3 top-3.5 text-purple-400 w-5 h-5" />
            <input
              type="text"
              required
              className="w-full pr-12 pl-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all placeholder-gray-600"
              placeholder="مثال: القائد صخر"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">جوهر العالم ووصفه</label>
          <div className="relative">
            <BookOpen className="absolute right-3 top-4 text-purple-400 w-5 h-5" />
            <textarea
              required
              className="w-full pr-12 pl-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all h-32 resize-none placeholder-gray-600"
              placeholder="صف ملامح الزمان والمكان، الأبطال، والأعداء..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">لهجة الراوي</label>
          <div className="relative">
            <Languages className="absolute right-3 top-3.5 text-purple-400 w-5 h-5" />
            <select
              className="w-full pr-12 pl-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all appearance-none cursor-pointer"
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
            >
              {DIALECTS.map(d => <option key={d.value} value={d.value} className="bg-black text-white">{d.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">شفرة الحماية (اختياري)</label>
          <div className="relative">
            <Lock className="absolute right-3 top-3.5 text-purple-400 w-5 h-5" />
            <input
              type="password"
              className="w-full pr-12 pl-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all placeholder-gray-600"
              placeholder="لحماية مذكرات القدر..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_8px_20px_rgba(124,58,237,0.3)] group"
        >
          <span>تفعيل الحكاية</span>
          <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
};
