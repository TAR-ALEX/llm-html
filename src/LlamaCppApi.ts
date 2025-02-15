import { LLMConfigChat } from "./LLMConfig";

export interface MyLLMApiConfig {
  apiKey?: string;
  dangerouslyAllowBrowser?: boolean;
  baseURL?: string;
}

export interface ChatCompletionMessage {
  role: string;
  content: string;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    logprobs: null;
    finish_reason: string | null;
  }[];
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null;
    finish_reason: string;
  }[];
  service_tier: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details: {
      reasoning_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
}

export interface ChatCompletionCreateParams extends LLMConfigChat {
  messages: ChatCompletionMessage[];
  stream: boolean;
}

class LLMApi {
  private config: MyLLMApiConfig;

  constructor(config: MyLLMApiConfig = {}) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig() {
    if (!this.config.baseURL) {
      throw new Error('baseURL is required for MyLLMApi');
    }
    if (this.config.dangerouslyAllowBrowser && !this.config.apiKey) {
      //console.warn('Using LLM in the browser without an API key is not recommended.');
    }
  }

  public chat = {
    completions: {
      create: async (
        params: ChatCompletionCreateParams,
        options?: { signal?: AbortSignal }
      ): Promise<AsyncIterable<ChatCompletionChunk> | ChatCompletion> => {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (params.stream) {
          headers['Accept'] = 'text/event-stream';
        } else {
          headers['Accept'] = 'application/json';
        }

        if (this.config.apiKey) {
          headers.Authorization = `Bearer ${this.config.apiKey}`;
        }

        // const response = await fetch(this.config.baseURL! + '/v1/chat/completions', {
        const response = await fetch(this.config.baseURL! + '', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...params }),
          signal: options?.signal,
        });

        if (!response.ok) {
          const error = await response.text().catch(() => response.statusText);
          throw new Error(`API request failed: ${response.status} ${error}`);
        }

        if (params.stream) {
          if (!response.body) {
            throw new Error('No response body received');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          async function* generate(): AsyncIterable<ChatCompletionChunk> {
            let buffer = '';

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n');
                buffer = chunks.pop() || '';

                for (const chunk of chunks) {
                  const trimmed = chunk.trim();
                  if (!trimmed) continue;
                  if (trimmed === 'data: [DONE]') return;

                  if (trimmed.startsWith('data: ')) {
                    try {
                      const json = trimmed.slice(6);
                      const data: ChatCompletionChunk = JSON.parse(json);
                      yield data;
                    } catch (e) {
                      console.error('Error parsing chunk:', e);
                    }
                  }
                }
              }

              // Process remaining buffer
              if (buffer.trim()) {
                console.warn('Unprocessed data remaining:', buffer);
              }
            } finally {
              reader.releaseLock();
            }
          }

          return generate();
        } else {
          const data: ChatCompletion = await response.json();
          return data;
        }
      }
    }
  };
}

export default LLMApi;