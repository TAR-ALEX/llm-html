import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { Container } from 'react-bootstrap';
import ChatBubble, { Message } from './ChatBubble';
import { LLMConfig } from './LLMConfig';
import { Property } from 'csstype';
import { AppConfig } from './AppConfig';

/**
 * Detects support for the CSS overflow-anchor property.
 *
 * @returns {boolean} True if overflow-anchor is supported, false otherwise.
 */
function supportsOverflowAnchor(): boolean {
    // Ensure we're in a browser environment.
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
  
    // Use CSS.supports if available.
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      return CSS.supports('overflow-anchor', 'auto');
    }
  
    // Fallback: Create an element and check for the property in its style.
    const testEl = document.createElement('div');
    return 'overflowAnchor' in testEl.style;
  }

export type ChatThreadProps = {
    messages: Message[];
    onEdit: (index: number, content: string) => void;
    onRefresh: (index: number) => void;
    onContinue: (index: number) => void;
    isLoading: boolean;
    editingIndex: number | null;
    setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
    llmConfig?: LLMConfig;
    appConfig?: AppConfig;
    onDelete?: (index: number) => void;
};

const ChatThread: React.FC<ChatThreadProps> = ({
    messages,
    onEdit,
    onRefresh,
    onContinue,
    isLoading,
    editingIndex,
    setEditingIndex,
    llmConfig,
    appConfig,
    onDelete,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const spacerRef = useRef<HTMLDivElement>(null);
    const listGroupRef = useRef<HTMLDivElement>(null);

    const listElems = messages.map((message, index) => {
        if(appConfig?.showSystemPrompt === false && message.sender === "system"){
            return;
        }
        return <ChatBubble
            key={`${index} ${message.sender}`}
            index={index}
            sender={message.sender}
            content={message.content}
            onEdit={onEdit}
            onRefresh={onRefresh}
            onContinue={onContinue}
            onDeleteMessage={onDelete}
            isLoading={isLoading}
            isLast={index >= messages.length - 1}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            llmConfig={llmConfig}
            appConfig={appConfig}
        />
    });

    // return (
    //     <Container
    //         ref={containerRef}
    //         style={{
    //             marginTop: '10px',
    //             marginBottom: '0px',
    //             display: 'flex',
    //             flexDirection: "column",
    //         }}
    //     >
    //             <div ref={listGroupRef} style={{ flexDirection: 'column' }}>
    //                 {listElems}
    //             </div>
    //             <div
    //                 // ref={bottomMarkerRef} // Attach ref to the marker div
    //                 style={{
    //                     overflowAnchor: "auto", // Use the state here
    //                     display: "flex", // Keep display flex if needed, or just height
    //                     height: "2px",    // Use height instead of minHeight if it's just a marker
    //                     flexShrink: 0,   // Prevent this tiny div from shrinking
    //                 }}
    //             />
    //     </Container>
    // );

    return (
        <Container>
        {listElems}
        </Container>
    );
};

export default memo(ChatThread);