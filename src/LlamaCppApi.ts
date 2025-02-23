import { LLMConfigChat } from "./LLMConfig";

export interface MyLLMApiConfig {
  apiKey?: string;
  thinkingTokens?: {
    start: string;
    end: string;
  }
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
      reasoning?: string;
      reasoning_content?: string;
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
      reasoning?: string;
      reasoning_content?: string;
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

  private checkMixedContent() {
    const currentProtocol = window.location.protocol;
    const apiProtocol = new URL(this.config.baseURL!).protocol;
    const apiHostname = new URL(this.config.baseURL!).hostname;

    if ((apiHostname !== 'localhost' && apiHostname !== '127.0.0.1') && (currentProtocol === 'https:' && apiProtocol === 'http:')) {
      throw new Error('Mixed content detected: The page is served over HTTPS, but the API URL is using HTTP causing a security downgrade. Please download the page locally or serve it via HTTP. This is a browser limitation');
    }
    // if (currentProtocol === 'http:' && apiProtocol === 'https:') {
    //   throw new Error('Mixed content detected: The page is served over HTTP, but the API URL is using HTTPS. Please download the page locally or serve it via HTTP.');
    // }
  }

  public chat = {
    completions: {
      create: async (
        params: ChatCompletionCreateParams,
        options?: { signal?: AbortSignal }
      ): Promise<AsyncIterable<ChatCompletionChunk> | ChatCompletion> => {
        this.checkMixedContent();
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

        const response = await fetch(this.config.baseURL!, {
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

          const generate = async function* (this: LLMApi): AsyncIterable<ChatCompletionChunk> {
            let buffer = '';
            let isReasoning = false;

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
                      if (this.config.thinkingTokens != null) {
                        if (data.choices[0].delta.reasoning_content)
                          data.choices[0].delta.reasoning = data.choices[0].delta.reasoning_content;
                        if (data.choices[0].delta.reasoning) {
                          if (!isReasoning) {
                            data.choices[0].delta.content = (data.choices[0].delta.content ?? "") + this.config.thinkingTokens.start;
                          }
                          isReasoning = true;
                          data.choices[0].delta.content = (data.choices[0].delta.content ?? "") + data.choices[0].delta.reasoning;
                        } else if (data.choices[0].delta.content) {
                          if (isReasoning) {
                            data.choices[0].delta.content = this.config.thinkingTokens.end + (data.choices[0].delta.content ?? "");
                          }
                          isReasoning = false;
                        }
                      }
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
          }.bind(this);

          return generate();
        } else {
          const data: ChatCompletion = await response.json();
          if (this.config.thinkingTokens != null) {
            if (data.choices[0].message.reasoning_content) {
              data.choices[0].message.reasoning = data.choices[0].message.reasoning_content;
            }
            if (data.choices[0].message.reasoning) {
              data.choices[0].message.content = this.config.thinkingTokens.start + (data.choices[0].message.reasoning ?? "") + this.config.thinkingTokens.end + data.choices[0].message.content;
            }
          }
          return data;
        }
      }
    }
  };
}

export default LLMApi;