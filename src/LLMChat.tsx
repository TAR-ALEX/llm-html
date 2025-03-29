import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import ChatThread from './ChatThread';
import ChatInput from './ChatInput';
import { v4 as uuidv4 } from 'uuid';
import { Message } from './ChatBubble';
import LLMApi, { ChatCompletion, ChatCompletionChunk } from './LlamaCppApi';
import { getThinkingStartAndEnd, LLMConfig, maskToLLMConfigChat, removeThinkingTokens } from './LLMConfig';
import { AppConfig } from './AppConfig';
import ScrollView from './ScrollView';

export type LLMChatProps = {
  llmConfig: LLMConfig;
  onMessagesChange?: (messages: Message[]) => void;
  initialMessages?: Message[];
  onError?: (header: string, content: string) => void;
  inputValue?: string;
  appConfig?: AppConfig;
  uuid?: string;
};

function newAssistantStarter(content?: string) {
  return { sender: 'assistant', content: content ?? "" };
}

const LLMChat: React.FC<LLMChatProps> = ({ llmConfig, onMessagesChange, initialMessages, onError, inputValue, appConfig, uuid }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [wholeMessages, setWholeMessages] = useState<Message[]>(messages);
  const [newMessage, setNewMessage] = useState(inputValue ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [configId, setConfigId] = useState(llmConfig.id);
  const [messageUUID, setMessageUUID] = useState(uuidv4());
  const messageUUIDRef = useRef(uuid);

  // Update the ref whenever messageUUID changes
  useEffect(() => {
    messageUUIDRef.current = messageUUID;
  }, [messageUUID]);

  useEffect(() => {
    setMessages(initialMessages);
    setWholeMessages(initialMessages);
    setMessageUUID(uuid);
  }, [uuid]);

  useEffect(() => {
    if (appConfig?.replaceSystemPromptOnConfigChange && configId !== llmConfig.id) {
      setConfigId(llmConfig.id);
      setMessages((msg) => {
        var newMsg = [...msg];
        if (newMsg.length !== 0 && newMsg[0].sender === 'system') {
          newMsg.shift();
        }
        if (llmConfig.defaultSystemPrompt) {
          newMsg.unshift({ sender: 'system', content: llmConfig.defaultSystemPrompt })
        }
        setWholeMessages(newMsg);
        return newMsg;
      });
    }
  }, [llmConfig, appConfig, initialMessages]);

  useEffect(() => {
    onMessagesChange?.(wholeMessages);
  }, [wholeMessages]);

  useEffect(() => {
    if (isLoading === false) setWholeMessages(messages);
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


    if (llmConfig.mask_thinking) {
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
      allowPrefixingChat: llmConfig.chatCompletionsPrefixAllowed ?? 0,
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
      const uuidChat = messageUUID;

      const flushBuffer = () => {
        if (buffer.length === 0) return;
        if (uuidChat !== messageUUIDRef.current) {
          controller.abort();
          return;
        }

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

      if (llmConfig.stream ?? true) {
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
      } else {
        buffer = (stream as ChatCompletion).choices[0].message.content;
        flushBuffer();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('API Error:', error);
        if (onError) onError("Error", `Error fetching response. Check console for details.\n\n${error}`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [wholeMessages, llmConfig, messageUUID]);

  const handleStopGeneration = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const handleEditMessage = useCallback((index: number, newContent: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[index].content = newContent;
      setWholeMessages(newMessages);
      return newMessages;
    });
  }, []);

  const handleDeleteMessage = useCallback(
    async (index: number) => {
      setMessages(prev => {
        let val = prev.slice(0, index);
        setWholeMessages(val);
        return val;
      });
    },
    []
  );

  const handleRefreshMessage = useCallback(
    async (index: number) => {
      const currentMessages = messages;

      let targetMessageIndex = index;
      const isTargetMessageAssistant = currentMessages[targetMessageIndex]?.sender === 'assistant';
      if (!isTargetMessageAssistant) targetMessageIndex += 1;
      let messagesHistory = currentMessages.slice(0, targetMessageIndex);
      if (targetMessageIndex > messagesHistory.length - 1) {
        messagesHistory = [...messagesHistory, newAssistantStarter(llmConfig.responsePrefix)];
      } else {
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

  const handleSendMessage = useCallback(async (newMessage: string) => {
    const newMessageContent = newMessage.trim();
    if (!newMessageContent || isLoading) return;

    const newUserMessage = { sender: 'user', content: newMessageContent };
    const updatedMessages = [...messages, newUserMessage, newAssistantStarter(llmConfig.responsePrefix)];

    setNewMessage('');
    setTimeout(() => inputRef.current?.focus(), 0);
    setTimeout(() => { setEditingIndex(null); }, 10);
    await fetchAssistantResponse(updatedMessages);
  }, [wholeMessages, newMessage, isLoading, fetchAssistantResponse]);


    // // --- New State and Refs for Scroll Detection ---
    // const [isScrolledToBottom, setIsScrolledToBottom] = useState(true); // Assume starts at bottom
    // const scrollContainerRef = useRef(null); // Ref for the main scrollable container
    // const bottomMarkerRef = useRef(null); // Ref for the div we want to observe
  
  
    // // --- Effect for Intersection Observer ---
    // useEffect(() => {
    //   const observer = new IntersectionObserver(
    //     ([entry]) => {
    //       // Update state based on whether the marker element is intersecting (visible)
    //       setIsScrolledToBottom(entry.isIntersecting);
    //     },
    //     {
    //       root: scrollContainerRef.current, // Use the container as the viewport
    //       rootMargin: '0px', // No margin
    //       threshold: 0.0, // Trigger as soon as 1 pixel is visible
    //     }
    //   );
  
    //   // If the marker element exists, start observing it
    //   if (bottomMarkerRef.current) {
    //     observer.observe(bottomMarkerRef.current);
    //   }
  
    //   // Cleanup function: disconnect the observer when the component unmounts
    //   // or before the effect runs again
    //   return () => {
    //     if (bottomMarkerRef.current) {
    //       // eslint-disable-next-line react-hooks/exhaustive-deps
    //       observer.unobserve(bottomMarkerRef.current);
    //     }
    //     observer.disconnect();
    //   };
    // }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // return (
  //   <Container
  //     ref={scrollContainerRef} // Attach ref to the scrollable container
  //     fluid
  //     className="d-flex h-100 p-0"
  //     style={{
  //       overflowAnchor: "auto",
  //       flexDirection: "column",
  //       flexGrow: 1,
  //       flexShrink: 0,
  //       overflowY: "scroll"
  //     }}
  //   >
  //     <div style={{ overflowAnchor: "auto", display: "flex", minHeight: "2px" }}/>
  //     <div style={{ overflowAnchor: "none", flex: 1 }}>
  //       <ChatThread
  //         key={messageUUID}
  //         messages={messages}
  //         onEdit={handleEditMessage}
  //         onRefresh={handleRefreshMessage}
  //         onContinue={handleContinueMessage}
  //         onDelete={handleDeleteMessage}
  //         isLoading={isLoading}
  //         editingIndex={editingIndex}
  //         setEditingIndex={setEditingIndex}
  //         llmConfig={llmConfig}
  //         appConfig={appConfig}
  //       />
  //     </div>
  //     {/* The marker div to detect if scrolled to bottom */}
  //     <div
  //       ref={bottomMarkerRef} // Attach ref to the marker div
  //       style={{
  //         overflowAnchor: isScrolledToBottom?"auto":"none", // Use the state here
  //         display: "flex", // Keep display flex if needed, or just height
  //         height: "2px",    // Use height instead of minHeight if it's just a marker
  //         flexShrink: 0,   // Prevent this tiny div from shrinking
  //       }}
  //     />
  //     <div className='bg-body-tertiary pt-2 pb-0 m-0' style={{ zIndex: "1", position: 'sticky', bottom: "0px" }}
  //     >
  //       <ChatInput
  //         value={newMessage}
  //         onSend={handleSendMessage}
  //         onStop={handleStopGeneration}
  //         isLoading={isLoading}
  //       />
  //     </div>
  //   </Container>
  // );

  return (
    <Container
      fluid
      className="d-flex h-100 p-0"
      style={{
        overflowAnchor: "auto",
        flexDirection: "column",
        flexGrow: 1,
        flexShrink: 0,
        overflow: "none"
      }}
    >
      <ScrollView className='m-0 p-0 scroller' style={{ height: '100%' }}>
      <div className='bg-body-tertiary pt-2 pb-0 m-0'>
        
        <ChatThread
          key={messageUUID}
          messages={messages}
          onEdit={handleEditMessage}
          onRefresh={handleRefreshMessage}
          onContinue={handleContinueMessage}
          onDelete={handleDeleteMessage}
          isLoading={isLoading}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          llmConfig={llmConfig}
          appConfig={appConfig}
        />
        
      </div>
      </ScrollView>
      <div style={{ flexGrow: 1, flexShrink: 0 }}></div>
      <div className='bg-body-tertiary pt-2 pb-0 m-0' >
        <ChatInput
          value={newMessage}
          onSend={handleSendMessage}
          onStop={handleStopGeneration}
          isLoading={isLoading}
        />
      </div>
      
    </Container>
  );
};

export default React.memo(LLMChat);