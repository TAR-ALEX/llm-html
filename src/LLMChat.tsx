import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import ChatThread from './ChatThread';
import ChatInput from './ChatInput';
import { Message } from './ChatBubble';
import LLMApi, { ChatCompletion, ChatCompletionChunk } from './LlamaCppApi';
import { getThinkingStartAndEnd, LLMConfig, maskToLLMConfigChat, removeThinkingTokens } from './LLMConfig';
import { AppConfig } from './AppConfig';

export type LLMChatProps = {
  llmConfig: LLMConfig;
  onMessagesChange?: (messages: Message[]) => void;
  initialMessages?: Message[];
  onError?: (header: string, content: string) => void;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  appConfig?: AppConfig;
};

function newAssistantStarter(content?: string) {
  return { sender: 'assistant', content: content ?? "" };
}

const LLMChat: React.FC<LLMChatProps> = ({ llmConfig, onMessagesChange, initialMessages, onError, inputValue, onInputValueChange, appConfig }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [wholeMessages, setWholeMessages] = useState<Message[]>(messages);
  const [newMessage, setNewMessage] = useState(inputValue ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [configId, setConfigId] = useState(llmConfig.id);

  useEffect(() => {
    if (appConfig?.replaceSystemPromptOnConfigChange && configId !== llmConfig.id) {
      setConfigId(llmConfig.id);
      setMessages((msg) => {
        var newMsg = [ ...msg ];
        if (newMsg.length !== 0 && newMsg[0].sender === 'system') {
          newMsg.shift();
          if (llmConfig.defaultSystemPrompt) {
            newMsg.unshift({ sender: 'system', content: llmConfig.defaultSystemPrompt })
          }
          setWholeMessages(newMsg);
        }
        return newMsg;
      });
    }
  }, [llmConfig, appConfig]);

  useEffect(() => {
    if (onInputValueChange) onInputValueChange(newMessage);
  }, [newMessage]);

  useEffect(() => {
    onMessagesChange?.(wholeMessages);
  }, [wholeMessages]);

  useEffect(() => {
    if(isLoading === false) setWholeMessages(messages);
  }, [isLoading]);

  const fetchAssistantResponse = useCallback(async (
    messagesHistory: Message[],
  ) => {
    const lastMessage = messagesHistory[messagesHistory.length - 1];
    if (lastMessage?.sender !== 'assistant') console.error('no premade assistant response.');
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);

    setMessages(messagesHistory);

    if (lastMessage.content === '') {
      messagesHistory = messagesHistory.slice(0, messagesHistory.length - 1);
    }


    if(llmConfig.mask_thinking){
      let thinking_escapes = getThinkingStartAndEnd(llmConfig);
      messagesHistory = removeThinkingTokens(messagesHistory, thinking_escapes);
    }
    

    const openai = new LLMApi({
      apiKey: llmConfig.apiKey ?? '', // Add your OpenAI API key here
      thinkingTokens: llmConfig.thinking_escapes,
      dangerouslyAllowBrowser: true,
      baseURL: llmConfig.baseURL,
      completionsPath: llmConfig.completionsPath,
      chatCompletionsPath: llmConfig.chatCompletionsPath,
      templatePath: llmConfig.templatePath,
      propsPath: llmConfig.propsPath,
      allowPrefixingChat: llmConfig.chatCompletionsPrefixAllowed ?? false,
      defaultChatTemplate: llmConfig.chatTemplate,
    });

    try {
      const stream = await openai.automatic.chat.completions.create({
        messages: messagesHistory.map((m) => {
            return {
                role: m.sender,
                content: m.content,
            };
        }),
        ...maskToLLMConfigChat(llmConfig),
        stream: llmConfig.stream ?? true,
      }, { signal: controller.signal });

      let buffer = '';
      let animationFrameId: number | null = null;

      const flushBuffer = () => {
        if (buffer.length === 0) return;

        const contentToAdd = buffer;
        buffer = '';

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          return lastMessage?.sender === 'assistant'
            ? [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + contentToAdd },
            ]
            : prev;
        });
      };

      if(llmConfig.stream ?? true){
        for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
          const contentChunk = chunk.choices[0]?.delta?.content || '';
          buffer += contentChunk;

          if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(() => {
              setTimeout(() => {
                flushBuffer();
                animationFrameId = null;
              }, 10);
            });
          }
        }

        // Flush any remaining content after stream ends
        flushBuffer();
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          flushBuffer();
        }
      }else{
        buffer = (stream as ChatCompletion).choices[0].message.content;
        flushBuffer();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('API Error:', error);
        if(onError) onError("Error", `Error fetching response. Check console for details.\n\n${error}`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [wholeMessages, llmConfig]);

  const handleStopGeneration = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const handleEditMessage = useCallback((index: number, newContent: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[index].content = newContent;
      return newMessages;
    });
  }, [wholeMessages]);

  const handleRefreshMessage = useCallback(
    async (index: number) => {
      const currentMessages = messages;

      let targetMessageIndex = index;
      const isTargetMessageAssistant = currentMessages[targetMessageIndex]?.sender === 'assistant';
      if (!isTargetMessageAssistant) targetMessageIndex += 1;
      let messagesHistory = currentMessages.slice(0, targetMessageIndex);
      if (targetMessageIndex > messagesHistory.length - 1) {
        messagesHistory = [...messagesHistory, newAssistantStarter(llmConfig.responsePrefix)];
      }else{
        messagesHistory[messagesHistory.length - 1].content = llmConfig.responsePrefix;
      }

      await fetchAssistantResponse(messagesHistory);
    },
    [wholeMessages, fetchAssistantResponse]
  );

  const handleContinueMessage = useCallback(
    async (index: number) => {
      const messagesHistory = messages.slice(0, index + 1);
      setMessages(messagesHistory);
      await fetchAssistantResponse(messagesHistory);
    },
    [wholeMessages, fetchAssistantResponse]
  );

  const handleSendMessage = useCallback(async () => {
    const newMessageContent = newMessage.trim();
    if (!newMessageContent || isLoading) return;

    const newUserMessage = { sender: 'user', content: newMessageContent };
    const updatedMessages = [...messages, newUserMessage, newAssistantStarter(llmConfig.responsePrefix)];

    setNewMessage('');
    setTimeout(() => inputRef.current?.focus(), 0);
    setTimeout(() => {setEditingIndex(null);}, 10);
    await fetchAssistantResponse(updatedMessages);
  }, [wholeMessages, newMessage, isLoading, fetchAssistantResponse]);

  return (
    <Container fluid className="d-flex flex-column gap-2 h-100 overflow-hidden p-0">
      <ChatThread
        messages={messages}
        onEdit={handleEditMessage}
        onRefresh={handleRefreshMessage}
        onContinue={handleContinueMessage}
        isLoading={isLoading}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        llmConfig={llmConfig}
        appConfig={appConfig}
      />
      <ChatInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSendMessage}
        onStop={handleStopGeneration}
        isLoading={isLoading}
      />
    </Container>
  );
};

export default React.memo(LLMChat);