import { Message } from "./ChatBubble";

export type LLMConfig = {
  id: string;
  name: string;
  baseURL: string;
  apiKey?: string;
  model?: string;
  thinking_escapes?: any;
  mask_thinking?: boolean;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  n_predict?: number;
  stop?: string[];
  typical_p?: number;
  n_keep?: number;
  n_indent?: number;
  dynatemp_range?: number;
  dynatemp_exponent?: number;
  mirostat?: 0 | 1 | 2;
  mirostat_tau?: number;
  mirostat_eta?: number;
  repeat_penalty?: number;
  repeat_last_n?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  dry_multiplier?: number;
  dry_base?: number;
  dry_allowed_length?: number;
  dry_penalty_last_n?: number;
  dry_sequence_breakers?: string[];
  xtc_probability?: number;
  xtc_threshold?: number;
  grammar?: string;
  json_schema?: any;
  seed?: number;
  ignore_eos?: boolean;
  logit_bias?: any;
  n_probs?: number;
  min_keep?: number;
  t_max_predict_ms?: number;
  id_slot?: number;
  cache_prompt?: boolean;
  return_tokens?: boolean;
  samplers?: string[];
  timings_per_token?: boolean;
  post_sampling_probs?: boolean;
  response_fields?: string[];
  lora?: any;
  defaultSystemPrompt?: string;
  include_reasoning?: boolean;
}

export type LLMConfigChat = Omit<LLMConfig, 'id' | 'name' | 'baseURL' | 'apiKey' | 'defaultSystemPrompt' | 'thinking_escapes' | 'mask_thinking'>;
// export type LLMConfigAPI = Pick<LLMConfig, 'id' | 'name' | 'baseURL' | 'apiKey'>;

export function maskToLLMConfigChat(config: LLMConfig): LLMConfigChat {
  var { id, name, baseURL, apiKey, defaultSystemPrompt, thinking_escapes, mask_thinking, ...chatConfig } = config;


  // if (typeof chatConfig.samplers === 'string') {
  //   try {
  //     const parsedSamplers = JSON.parse(chatConfig.samplers);
  //     if (Array.isArray(parsedSamplers) && parsedSamplers.every(item => typeof item === 'string')) {
  //       chatConfig.samplers = parsedSamplers;
  //     } else {
  //       throw new Error('Invalid samplers JSON format');
  //     }
  //   } catch (error) {
  //     console.error('Error parsing samplers JSON:', error);
  //   }
  // }

  return chatConfig;
}

export function getThinkingStartAndEnd(llmConfig: LLMConfig) {
  let thinkingStart = null;
  let thinkingEnd = null;

  try {
    // Parse the input string into a JavaScript object
    const parsed = llmConfig.thinking_escapes;

    // Extract the start and end values if they exist
    if (parsed.start && parsed.end) {
      thinkingStart = parsed.start;
      thinkingEnd = parsed.end;
    }
  } catch (error) {
    // If parsing fails, the variables remain null
    console.error("Failed to parse thinking escape json:", llmConfig.thinking_escapes, error);
  }

  return { thinkingStart, thinkingEnd };
}

export function removeThinkingTokens(
  messageStructure: Message[],
  thinkingTokens?: {
    thinkingStart: string;
    thinkingEnd: string;
  }
): Message[] {
  if (!thinkingTokens) {
    // Return a deep copy of the original array to avoid mutation
    return messageStructure.map(message => ({ ...message }));
  }

  const { thinkingStart, thinkingEnd } = thinkingTokens;

  // Create a deep copy of the messageStructure array
  const updatedMessages = messageStructure.map((message) => {
    // Create a new message object with copied properties
    const newMessage = { ...message };

    if (newMessage.sender === "assistant") {
      let cleanedContent = "";
      const sections = newMessage.content.split(thinkingStart);
      
      // Always keep the part before the first thinkingStart
      cleanedContent = sections[0];
      
      // Process subsequent sections that appear after thinkingStart
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const endIndex = section.indexOf(thinkingEnd);
        
        if (endIndex !== -1) {
          // Add the part after thinkingEnd if the end marker exists
          cleanedContent += section.substring(endIndex + thinkingEnd.length);
        }
        // If no end marker, discard the entire section
      }
      
      // Trim whitespace from start/end of final content
      newMessage.content = cleanedContent.trim();
    }
    return newMessage;
  });

  return updatedMessages;
}