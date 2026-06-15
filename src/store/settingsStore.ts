import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'openai' | 'anthropic';

interface SettingsState {
  aiProvider: AIProvider;
  openaiKey: string;
  openaiModel: string;
  openaiBaseUrl: string;
  anthropicKey: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  
  setAIProvider: (provider: AIProvider) => void;
  setOpenaiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  setOpenaiBaseUrl: (url: string) => void;
  setAnthropicKey: (key: string) => void;
  setAnthropicModel: (model: string) => void;
  setAnthropicBaseUrl: (url: string) => void;
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

      setAIProvider: (provider) => set({ aiProvider: provider }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setOpenaiModel: (model) => set({ openaiModel: model }),
      setOpenaiBaseUrl: (url) => set({ openaiBaseUrl: url }),
      setAnthropicKey: (key) => set({ anthropicKey: key }),
      setAnthropicModel: (model) => set({ anthropicModel: model }),
      setAnthropicBaseUrl: (url) => set({ anthropicBaseUrl: url }),
    }),
    {
      name: 'skill-atlas-settings', // unique name for localStorage key
    }
  )
);
