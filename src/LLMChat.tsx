import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import ChatThread from './ChatThread';
import ChatInput from './ChatInput';
import { Message } from './ChatBubble';
import LLMApi, { ChatCompletion, ChatCompletionChunk } from './LlamaCppApi';
import { getThinkingStartAndEnd, LLMConfig, maskToLLMConfigChat, removeThinkingTokens } from './LLMConfig';

export type LLMChatProps = {
  llmConfig: LLMConfig;
  onMessagesChange?: (messages: Message[]) => void;
  initialMessages?: Message[];
};

const newAssistantStarter = { sender: 'assistant', content: '' };

const LLMChat: React.FC<LLMChatProps> = ({ llmConfig, onMessagesChange, initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [wholeMessages, setWholeMessages] = useState<Message[]>(messages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onMessagesChange?.(wholeMessages);
  }, [wholeMessages]);

  useEffect(() => {
    setWholeMessages(messages);
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
    });

    try {
      const stream = await openai.chat.completions.create({
        messages: messagesHistory.map((m) => {
            return {
                role: m.sender,//== "user" ? "user" : "assistant"
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
        alert('Error fetching response. Check console for details.');
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
        messagesHistory = [...messagesHistory, newAssistantStarter];
      }
      messagesHistory[messagesHistory.length - 1].content = '';

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
    const updatedMessages = [...messages, newUserMessage, newAssistantStarter];

    setNewMessage('');
    setEditingIndex(null);
    setTimeout(() => inputRef.current?.focus(), 0);
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