
import { GoogleGenAI, Type } from "@google/genai";

// Use a consistent system instruction for interactive storytelling
const getSystemInstruction = (userName: string, storyDescription: string, dialect: string = 'العربية الفصحى') => `
أنت "حكاية AI"، محرك سرد قصصي تفاعلي سينمائي.

** سياق القصة الثابت (الميثاق) **:
- البطل/الكيان الأساسي: [${userName}]
- جوهر العالم والقواعد: [${storyDescription}]

** قواعد العمل الصارمة **:
1. يجب أن تلتزم تماماً بهوية البطل ووصف العالم المذكور أعلاه في كل استجابة.
2. "الراوي": يجب أن يكون سرده طويلاً جداً ومسهباً للغاية (400 كلمة فأكثر في كل رد)، يصف المشهد بأسلوب أدبي رفيع وعميق، يركز على الحواس (السمع، الشم، اللمس، البصر) والتفاصيل الدقيقة للبيئة والمشاعر.
3. "اللهجة": كل النص (الراوي + الشخصيات) يجب أن يكون بـ [${dialect}].
4. "الشخصيات": تظهر في مصفوفة characterDialogues. يجب تضمين المشاعر بين أقواس مثل: "(بهمس خائف)".
5. "الاقتراحات": 3 مسارات طويلة ومصيرية.
6. المخرجات: JSON حصراً. لا تخرج عن القالب.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    narratorText: { type: Type.STRING, description: "وصف درامي طويل جداً وتفصيلي للمشهد" },
    characterDialogues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          text: { type: Type.STRING, description: "نص الحوار مع المشاعر بين أقواس" },
        },
        required: ["name", "text"],
      },
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "مسارات درامية مشوقة" },
    },
  },
  required: ["narratorText", "suggestions"],
};

// Removed getApiKey as the key is now obtained exclusively from process.env.GEMINI_API_KEY

export const generateStoryMetadata = async (userName: string, description: string) => {
  // Initialize AI client right before use with the environment variable API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      emoji: { type: Type.STRING },
      summary: { type: Type.STRING }
    },
    required: ["title", "emoji", "summary"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `أنشئ بطاقة هوية لقصة بطلها ${userName}. الوصف: ${description}. رد بـ JSON بالعربية.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  return JSON.parse(response.text || "{}");
};

export const summarizeStoryArc = async (history: string) => {
  // Initialize AI client with the environment variable API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `لخص أحداث هذه القصة في نقاط زمنية قصيرة كخريطة طريق: \n\n ${history}`,
  });
  return response.text;
};

export const generateAvatarPrompt = async (characterName: string, storyContext: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Generate a highly detailed, cinematic image generation prompt in English for a character named "${characterName}". 
Context from the story: "${storyContext}".
The prompt should describe their physical appearance, clothing, lighting, and mood. Keep it under 50 words. Just return the prompt text directly.`,
    });
    return response.text?.trim() || `A high quality, detailed portrait avatar of a character named ${characterName}. Style: cinematic, highly detailed face, dramatic lighting.`;
  } catch (error) {
    console.error("Prompt Generation Error:", error);
    return `A high quality, detailed portrait avatar of a character named ${characterName}. Style: cinematic, highly detailed face, dramatic lighting.`;
  }
};

export const generateCharacterAvatar = async (promptText: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: promptText,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Avatar Generation Error:", error);
    return null;
  }
};

export const generateStoryResponse = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  userName: string,
  description: string,
  dialect: string = 'العربية الفصحى'
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: getSystemInstruction(userName, description, dialect),
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
