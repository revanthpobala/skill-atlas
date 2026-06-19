import { useSettingsStore } from '@/store/settingsStore';

export async function fetchAISuggestions(
  content: string, 
  onChunk: (text: string) => void
): Promise<void> {
  const store = useSettingsStore.getState();
  const provider = store.aiProvider;

  const prompt = `Analyze this agentic skill code. Briefly describe what it does, highlight any potential infinite loop or atomicity issues, and propose a clean, specific refactoring if needed. Keep your response concise, using markdown for formatting and code blocks.\n\n\`\`\`\n${content}\n\`\`\``;

  return _runAI(provider, store, [{ role: 'user', content: prompt }], onChunk);
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

  return _runAI(provider, store, [{ role: 'user', content: prompt }], onChunk);
}

export async function fetchAIChat(
  messages: { role: string, content: string }[],
  onChunk: (text: string) => void
): Promise<void> {
  const store = useSettingsStore.getState();
  const provider = store.aiProvider;

  return _runAI(provider, store, messages, onChunk);
}

async function _runAI(provider: string, store: any, messages: any[], onChunk: (text: string) => void) {
  if (provider === 'openai') {
    if (!store.openaiKey) throw new Error('LLM key is not set, please set it');
    
    // Clean up base URL to prevent double slashes
    const baseUrl = store.openaiBaseUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/chat/completions`;
    
    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.openaiKey}`
        },
        body: JSON.stringify({
          model: store.openaiModel,
          messages: messages,
          stream: true
        })
      });
    } catch (e: any) {
      if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
        throw new Error(`CORS Error: The browser blocked the request to ${targetUrl}. Because your Enterprise LiteLLM is hosted internally or behind a VPN, our cloud proxy cannot reach it. You MUST configure your Enterprise LiteLLM to allow Cross-Origin Requests (CORS) from 'https://atlas-skills.netlify.app', OR install a 'CORS Unblock' browser extension to use the AI features.`);
      }
      throw e;
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
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
    if (!store.anthropicKey) throw new Error('LLM key is not set, please set it');

    const baseUrl = store.anthropicBaseUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/v1/messages`;

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': store.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: store.anthropicModel,
          max_tokens: 4000,
          messages: messages,
          stream: true
        })
      });
    } catch (e: any) {
      if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
        throw new Error(`CORS Error: The browser blocked the request to ${targetUrl}. Because your Enterprise LiteLLM is hosted internally or behind a VPN, our cloud proxy cannot reach it. You MUST configure your Enterprise LiteLLM to allow Cross-Origin Requests (CORS) from 'https://atlas-skills.netlify.app', OR install a 'CORS Unblock' browser extension to use the AI features.`);
      }
      throw e;
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API Error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
              onChunk(data.delta.text);
            }
          } catch (e) {}
        }
      }
    }
  } else if (provider === 'gemini') {
    if (!store.geminiKey) throw new Error('LLM key is not set, please set it');

    const baseUrl = store.geminiBaseUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/v1beta/models/${store.geminiModel}:streamGenerateContent?alt=sse`;

    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': store.geminiKey
        },
        body: JSON.stringify({
          contents: geminiMessages
        })
      });
    } catch (e: any) {
      if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
        throw new Error(`CORS Error: The browser blocked the request to ${targetUrl}.`);
      }
      throw e;
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
              onChunk(data.candidates[0].content.parts[0].text);
            }
          } catch (e) {}
        }
      }
    }
  }
}
