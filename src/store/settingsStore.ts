import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

interface SettingsState {
  aiProvider: AIProvider;
  openaiKey: string;
  openaiModel: string;
  openaiBaseUrl: string;
  anthropicKey: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  geminiKey: string;
  geminiModel: string;
  geminiBaseUrl: string;
  
  setAIProvider: (provider: AIProvider) => void;
  setOpenaiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  setOpenaiBaseUrl: (url: string) => void;
  setAnthropicKey: (key: string) => void;
  setAnthropicModel: (model: string) => void;
  setAnthropicBaseUrl: (url: string) => void;
  setGeminiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setGeminiBaseUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiProvider: 'openai',
      openaiKey: '',
      openaiModel: 'gpt-4o',
      openaiBaseUrl: 'https://api.openai.com/v1',
      anthropicKey: '',
      anthropicModel: 'claude-3-5-sonnet-20241022',
      anthropicBaseUrl: 'https://api.anthropic.com',
      geminiKey: '',
      geminiModel: 'gemini-flash-latest',
      geminiBaseUrl: 'https://generativelanguage.googleapis.com',

      setAIProvider: (provider) => set({ aiProvider: provider }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setOpenaiModel: (model) => set({ openaiModel: model }),
      setOpenaiBaseUrl: (url) => set({ openaiBaseUrl: url }),
      setAnthropicKey: (key) => set({ anthropicKey: key }),
      setAnthropicModel: (model) => set({ anthropicModel: model }),
      setAnthropicBaseUrl: (url) => set({ anthropicBaseUrl: url }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      setGeminiModel: (model) => set({ geminiModel: model }),
      setGeminiBaseUrl: (url) => set({ geminiBaseUrl: url }),
    }),
    {
      name: 'skill-atlas-settings', // unique name for localStorage key
    }
  )
);
