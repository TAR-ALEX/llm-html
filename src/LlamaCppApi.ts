import { LLMConfigChat } from "./LLMConfig";
import { Template } from "@huggingface/jinja";
import { format } from 'date-fns';

export interface MyLLMApiConfig {
  apiKey?: string;
  thinkingTokens?: {
    start: string;
    end: string;
  }
  dangerouslyAllowBrowser?: boolean;
  baseURL?: string;
  chatCompletionsPath?: string;
  completionsPath?: string;
  templatePath?: string;
  propsPath?: string;
  allowPrefixingChat?: number;
  defaultChatTemplate?: any;
}

export interface ApplyTemplateResponse{
  prompt: string;
}

export interface ChatCompletionMessage {
  role: string;
  content: string;
  prefix?: boolean;
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
  continue_final_message?: boolean;
  messages: ChatCompletionMessage[];
  stream: boolean;
}

export interface CompletionsCreateParams extends LLMConfigChat {
  prompt: string;
  stream: boolean;
}

class LLMApi {
  private config: MyLLMApiConfig;

  constructor(config: MyLLMApiConfig = {}) {
    this.config = config;

    function sanitizePath(path: string): string {
      // Remove leading and trailing slashes
      return path.replace(/^\/+|\/+$/g, '');
    }

    if (config.baseURL) {
      config.baseURL = sanitizePath(config.baseURL);
    }
    if (config.chatCompletionsPath) {
      config.chatCompletionsPath = "/"+sanitizePath(config.chatCompletionsPath);
    }
    if (config.completionsPath) {
      config.completionsPath = "/"+sanitizePath(config.completionsPath);
    }
    if (config.templatePath) {
      config.templatePath = "/"+sanitizePath(config.templatePath);
    }
    if (config.propsPath) {
      config.propsPath = "/"+sanitizePath(config.propsPath);
    }

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

  public props = {
    get: async (): Promise<any> => {//TODO: add type for this
      this.checkMixedContent();
      const headers: HeadersInit = {
        // 'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (this.config.apiKey) {
        headers.Authorization = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.baseURL!+this.config.propsPath, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.text().catch(() => response.statusText);
        throw new Error(`API request failed: ${response.status} ${error}`);
      }

      const data: any = await response.json();
      return data;
    }
  }

  public applyTemplate = {
    create: async (
      params: ChatCompletionCreateParams,
      options?: { signal?: AbortSignal }
    ): Promise<ApplyTemplateResponse> => {
      this.checkMixedContent();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (this.config.apiKey) {
        headers.Authorization = `Bearer ${this.config.apiKey}`;
      }
      let {messages} = params;

      const response = await fetch(this.config.baseURL!+this.config.templatePath, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.text().catch(() => response.statusText);
        throw new Error(`API request failed: ${response.status} ${error}`);
      }

      const data: ApplyTemplateResponse = await response.json();
      return data;
    }
  }

  public completions = {
    create: async (
      params: CompletionsCreateParams,
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

      const response = await fetch(this.config.baseURL+this.config.completionsPath, {
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
                    const data: any = JSON.parse(json);
                    const retData: ChatCompletionChunk = { ...data };
                     // Update the choices property
                    retData.choices = data.choices.map((choice: any, index: any) => ({
                      delta: {
                        role: "assistant",
                        content: choice.text,
                      },
                      index,
                    }));
                    yield retData;
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
        const data = await response.json();
        // convert/remap data from completions to chat/completions format
        // Create a shallow copy of data to avoid mutating the original data
        const retData: ChatCompletion = { ...data };

        // Update the choices property
        retData.choices = data.choices.map((choice: any, index: any) => ({
          message: {
            role: "assistant",
            content: choice.text,
          },
          index,
        }));
        return retData;
      }
    }
  }

  public automatic = {
    chat: {
      completions: {
        create: async (
          params: ChatCompletionCreateParams,
          options?: { signal?: AbortSignal }
        ): Promise<AsyncIterable<ChatCompletionChunk> | ChatCompletion> => {
          if (!this.config.baseURL) {
            throw new Error(`Failure: base URL is not defined.`);
          }

          var useLegacyCompletions = false;

          if(!this.config.chatCompletionsPath){
            useLegacyCompletions = true;
            if(!this.config.completionsPath){
              throw new Error(`Failure: define a supported API path in the config, for example: /v1/chat/completions or /v1/completions`);
            }
          }else if(this.config.defaultChatTemplate){
            useLegacyCompletions = true;
            if(!this.config.completionsPath){
              throw new Error(`Failure: To use a custom chat template, you need to have a /v1/completions endpoint specified.`);
            }
          }else if((this.config.allowPrefixingChat ?? 0) === 0 && params.messages[params.messages.length-1].role === 'assistant'){
            useLegacyCompletions = true;
            if(!this.config.completionsPath){
              throw new Error(`Failure: To continue/prefix an assistant message, you need to have a /v1/completions endpoint specified or have 'Chat Prefixing' enabled for /v1/chat/completions.`);
            }
          }

          if(params.messages[params.messages.length-1].role === 'assistant'){
            if(params.grammar || params.json_schema){
              throw new Error(`Error: Cannot continue an assistant message, when a grammar/json_schema is specified, prefix portion will not follow any rules.`);
            }
          }

          if (!useLegacyCompletions) {
            return this.chat.completions.create(params, options);
          } else {
            if(this.config.defaultChatTemplate) {
              var template = this.config.defaultChatTemplate!;
              return this.virtual.completionsWithTemplate.create(params, template, options);
            }else if (this.config.templatePath) {
              return this.virtual.completionsApplyTemplate.create(params, options);
            } else if (this.config.propsPath) {
              let data = await this.props.get(); 
              return this.virtual.completionsWithTemplate.create(params, data, options);
            } 
            throw new Error(`Failure: Could not get a chat template for /v1/completions. try setting a Template Path or Props Path, or a Chat Template.`);
          }
        }
      }
    }
  }

  public virtual = {// behaves just like chat completions, but uses apply-template and regular completions.
    completionsApplyTemplate: {
      create: async (
        params: ChatCompletionCreateParams,
        options?: { signal?: AbortSignal }
      ): Promise<AsyncIterable<ChatCompletionChunk> | ChatCompletion> => {
        const endTruncateToken = "<=<=<magicENDTOKENaasdfbu>=>=>"; // just some unique set of strings

        if(params.messages[params.messages.length-1].role !== 'assistant'){
          params.messages.push({role: "assistant", content: ""});
        }

        params.messages[params.messages.length-1].content += endTruncateToken;

        let data = await this.applyTemplate.create(params, options); 

        let splitText = data.prompt.split(endTruncateToken)

        if(splitText.length <= 0){
          throw new Error('Chat template failed to apply');
        }

        let result = splitText[0];

        data.prompt = data.prompt.split(endTruncateToken)[0];

        var {messages, ...completionsParams} = {prompt: result, ...params};

        return this.completions.create(completionsParams, options);
      }
    },
    completionsWithTemplate: {
      create: async (
        params: ChatCompletionCreateParams,
        template: {
          chat_template:string,
          bos_token: string,
          eos_token: string,
        },
        options?: { signal?: AbortSignal }
      ): Promise<AsyncIterable<ChatCompletionChunk> | ChatCompletion> => {
        //template.chat_template = "{%- set today = strftime_now(\"%Y-%m-%d\") %}\n{%- set default_system_message = \"You are Mistral Small 3, a Large Language Model (LLM) created by Mistral AI, a French startup headquartered in Paris.\\nYour knowledge base was last updated on 2023-10-01. The current date is \" + today + \".\\n\\nWhen you're not sure about some information, you say that you don't have the information and don't make up anything.\\nIf the user's question is not clear, ambiguous, or does not provide enough context for you to accurately answer the question, you do not try to answer it right away and you rather ask the user to clarify their request (e.g. \\\"What are some good restaurants around me?\\\" => \\\"Where are you?\\\" or \\\"When is the next flight to Tokyo\\\" => \\\"Where do you travel from?\\\")\" %}\n\n{{- bos_token }}\n\n{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content'] %}\n    {%- set loop_messages = messages[1:] %}\n{%- else %}\n    {%- set system_message = default_system_message %}\n    {%- set loop_messages = messages %}\n{%- endif %}\n{{- '[SYSTEM_PROMPT]' + system_message + '[/SYSTEM_PROMPT]' }}\n\n{%- for message in loop_messages %}\n    {%- if message['role'] == 'user' %}\n        {{- '[INST]' + message['content'] + '[/INST]' }}\n    {%- elif message['role'] == 'system' %}\n        {{- '[SYSTEM_PROMPT]' + message['content'] + '[/SYSTEM_PROMPT]' }}\n    {%- elif message['role'] == 'assistant' %}\n        {{- message['content'] + eos_token }}\n    {%- else %}\n        {{- raise_exception('Only user, system and assistant roles are supported!') }}\n    {%- endif %}\n{%- endfor %}";
        const tem = new Template(template.chat_template);
        
        const endTruncateToken = "<=<=<magicENDTOKENaasdfbu>=>=>"; // just some unique set of strings

        if(params.messages[params.messages.length-1].role !== 'assistant'){
          params.messages.push({role: "assistant", content: ""});
        }

        params.messages[params.messages.length-1].content += endTruncateToken;

        function strftime_now(formatString: string): string {
            const now = new Date();
            return format(now, formatString);
        }

        var result = tem.render({
          messages: params.messages,
          bos_token: template.bos_token,
          eos_token: template.eos_token,
          strftime_now: strftime_now,
        });

        if(result.startsWith(template.bos_token)){
          result = result.substring(template.bos_token.length);
        }

        let splitText = result.split(endTruncateToken)

        if(splitText.length <= 0){
          throw new Error('Chat template failed to apply');
        }

        result = splitText[0];

        var {messages, ...completionsParams} = {prompt: result, ...params};
        return this.completions.create(completionsParams, options);
      }
    }
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

        if(params.messages[params.messages.length-1].role === 'assistant'){
          if(this.config.allowPrefixingChat === 1){
            params.messages[params.messages.length-1].prefix = true;
          }
          if(this.config.allowPrefixingChat === 2){
            params.continue_final_message = true;
          }
        }

        const response = await fetch(this.config.baseURL! + this.config.chatCompletionsPath, {
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
            if(params.messages[params.messages.length-1].role === 'assistant'){
              const cont = params.messages[params.messages.length-1].content;
              if(cont.includes(this.config.thinkingTokens.start) && !cont.includes(this.config.thinkingTokens.end)){
                isReasoning = true;
              }
            }

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