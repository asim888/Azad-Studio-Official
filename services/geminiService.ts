import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptionResult } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize only if key exists to prevent immediate errors in environments without keys
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const GeminiService = {
  summarizeMessages: async (messages: string[]): Promise<string> => {
    if (!ai) {
      console.warn("Gemini API Key is missing. Mocking response.");
      return new Promise(resolve => setTimeout(() => resolve("Summary unavailable: API Key missing. Please configure process.env.API_KEY."), 1000));
    }

    try {
      const prompt = `Summarize the following Telegram channel messages into a concise daily update bullet list:\n\n${messages.join('\n---\n')}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Could not generate summary.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Failed to generate summary due to an error.";
    }
  },

  transcribeAudio: async (base64Audio: string, mimeType: string): Promise<TranscriptionResult> => {
    if (!ai) {
      console.warn("Gemini API Key is missing. Mocking response.");
      return new Promise(resolve => setTimeout(() => resolve({
        original: "API Key Missing. This is a mock transcription.",
        hindi: "एपीआई कुंजी गायब है। यह एक नकली प्रतिलेखन है।",
        urdu: "API کلید غائب ہے۔ یہ ایک فرضی نقل ہے۔",
        telugu: "API కీ లేదు. ఇది నకిలీ ట్రాన్స్‌క్రిప్షన్."
      }), 1000));
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            },
            {
              text: "Transcribe the audio accurately. Automatically detect the language. Return the transcription in the original language. Also provide translations of the transcription into Hindi, Urdu, and Telugu. If the original language is one of these, still provide it in the respective field."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING, description: "The verbatim transcription in the original language" },
              hindi: { type: Type.STRING, description: "Translation in Hindi" },
              urdu: { type: Type.STRING, description: "Translation in Urdu" },
              telugu: { type: Type.STRING, description: "Translation in Telugu" }
            },
            required: ["original", "hindi", "urdu", "telugu"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from model");
      
      return JSON.parse(text) as TranscriptionResult;
    } catch (error) {
      console.error("Gemini Transcription Error:", error);
      throw error;
    }
  },

  transcribeVideo: async (videoUrl: string): Promise<TranscriptionResult> => {
     // NOTE: Real video processing requires extracting audio frames or sending the video file if supported.
     // For this demo, we mock the result based on the known demo video URL or return a generic response.
     
     if (videoUrl.includes("ForBiggerBlazes")) {
        return new Promise(resolve => setTimeout(() => resolve({
            original: "So, in this video, we are going to learn how to build a Telegram Bot using Node.js. It's actually quite simple once you get the hang of the API.",
            hindi: "तो, इस वीडियो में, हम सीखेंगे कि Node.js का उपयोग करके टेलीग्राम बॉट कैसे बनाया जाए। एक बार जब आप एपीआई को समझ लेते हैं तो यह वास्तव में काफी सरल होता है।",
            urdu: "تو، اس ویڈیو میں، ہم سیکھنے جا رہے ہیں کہ Node.js کا استعمال کرتے ہوئے ٹیلیگرام بوٹ کیسے بنایا جائے۔ ایک بار جب آپ API کو سمجھ لیتے ہیں تو یہ اصل میں بہت آسان ہے۔",
            telugu: "కాబట్టి, ఈ వీడియోలో, మనం Node.js ఉపయోగించి టెలిగ్రామ్ బాట్‌ను ఎలా నిర్మించాలో నేర్చుకోబోతున్నాం. మీరు APIని అర్థం చేసుకున్న తర్వాత ఇది చాలా సులభం."
        }), 1500));
     }

     if (!ai) {
        return {
            original: "Demo Video Transcription (API Key Missing)",
            hindi: "डेमो वीडियो ट्रांसक्रिप्शन (कुंजी गायब)",
            urdu: "ڈیمو ویڈیو ٹرانسکرپشن (کلید غائب)",
            telugu: "డెమో వీడియో ట్రాన్స్‌క్రిప్షన్ (కీ లేదు)"
        };
     }

     // In a real app, you would download the video, extract audio/frames, and send to Gemini.
     // Here we simulate a generic AI response for unknown videos.
     return {
         original: "This is a placeholder transcription for the video content. The AI analyzes the audio stream to generate text.",
         hindi: "यह वीडियो सामग्री के लिए एक प्लेसहोल्डर प्रतिलेखन है। AI टेक्स्ट उत्पन्न करने के लिए ऑडियो स्ट्रीम का विश्लेषण करता है।",
         urdu: "یہ ویڈیو مواد کے لیے ایک پلیس ہولڈر ٹرانسکرپشن ہے۔ AI متن بنانے کے لیے آڈیو سٹریم کا تجزیہ کرتا ہے۔",
         telugu: "ఇది వీడియో కంటెంట్ కోసం ప్లేస్‌హోల్డర్ ట్రాన్స్‌క్రిప్షన్. వచనాన్ని రూపొందించడానికి AI ఆడియో స్ట్రీమ్‌ను విశ్లేషిస్తుంది."
     };
  },

  translateText: async (text: string): Promise<TranscriptionResult> => {
    if (!ai) {
      console.warn("Gemini API Key is missing. Mocking response.");
      return new Promise(resolve => setTimeout(() => resolve({
        original: text,
        hindi: "यह एक डमी हिंदी अनुवाद है क्योंकि एपीआई कुंजी गायब है।",
        urdu: "یہ ایک ڈمی اردو ترجمہ ہے کیونکہ API کلید غائب ہے۔",
        telugu: "API కీ లేనందున ఇది డమ్మీ తెలుగు అనువాదం."
      }), 1000));
    }

    try {
      const prompt = `Translate the following text into Hindi, Urdu, and Telugu.\n\nText: "${text}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING, description: "The original text" },
              hindi: { type: Type.STRING, description: "Translation in Hindi" },
              urdu: { type: Type.STRING, description: "Translation in Urdu" },
              telugu: { type: Type.STRING, description: "Translation in Telugu" }
            },
            required: ["original", "hindi", "urdu", "telugu"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response from model");
      
      // Ensure the original text is passed back if the model didn't return it exactly
      const parsed = JSON.parse(resultText) as TranscriptionResult;
      parsed.original = text; 
      
      return parsed;
    } catch (error) {
      console.error("Gemini Translation Error:", error);
      throw error;
    }
  }
};
