import { useSettingsStore } from '@/store/settingsStore';

export async function fetchAISuggestions(
  content: string, 
  onChunk: (text: string) => void
): Promise<void> {
  const store = useSettingsStore.getState();
  const provider = store.aiProvider;

  const prompt = `Analyze this agentic skill code. Briefly describe what it does, highlight any potential infinite loop or atomicity issues, and propose a clean, specific refactoring if needed. Keep your response concise, using markdown for formatting and code blocks.\n\n\`\`\`\n${content}\n\`\`\``;

  return _runAI(provider, store, prompt, onChunk);
}

export async function fetchAIEdit(
  content: string,
  instruction: string,
  onChunk: (text: string) => void
): Promise<void> {
  const store = useSettingsStore.getState();
  const provider = store.aiProvider;

  const prompt = `You are an expert AI coding assistant. You are given the source code of an agentic skill. Apply the following user instruction to the code.
Return ONLY the final modified raw code. DO NOT include markdown formatting blocks (like \`\`\`python). DO NOT include explanations. Just return the raw raw code so it can be directly piped into a code editor.

Instruction:
${instruction}

Original Code:
${content}`;

  return _runAI(provider, store, prompt, onChunk);
}

async function _runAI(provider: string, store: any, prompt: string, onChunk: (text: string) => void) {
  if (provider === 'openai') {
    if (!store.openaiKey) throw new Error('OpenAI API Key is missing. Please configure it in settings.');
    
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `${store.openaiBaseUrl}/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.openaiKey}`
        },
        body: {
          model: store.openaiModel,
          messages: [{ role: 'user', content: prompt }],
          stream: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            // ignore JSON parse error on incomplete chunks
          }
        }
      }
    }
  } else if (provider === 'anthropic') {
    if (!store.anthropicKey) throw new Error('Anthropic API Key is missing. Please configure it in settings.');

    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `${store.anthropicBaseUrl}/v1/messages`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': store.anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: {
          model: store.anthropicModel,
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
          stream: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API Error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
              onChunk(data.delta.text);
            }
          } catch (e) {}
        }
      }
    }
  }
}
