
export interface CharacterSpeech {
  name: string;
  text: string;
}

export interface StoryMessage {
  id: string;
  role: 'user' | 'assistant';
  narratorText?: string;
  characterDialogues?: CharacterSpeech[];
  suggestions?: string[];
  userText?: string;
  timestamp: number;
}

export interface Story {
  id: string;
  userName: string;
  description: string;
  title: string;       
  emoji: string;       
  summary: string;     
  password?: string;
  messages: StoryMessage[];
  createdAt: number;
  category: 'system' | 'user';
  dialect?: string;
  isHidden?: boolean;
}

export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'Vazirmatn' | 'Cairo' | 'Tajawal';
  theme: 'dark' | 'light';
  language: 'ar' | 'en';
}

export enum AppState {
  SETUP = 'SETUP',
  AUTH = 'AUTH',
  CHAT = 'CHAT',
  LOBBY = 'LOBBY',
  SETTINGS = 'SETTINGS',
  GENERATING = 'GENERATING'
}
