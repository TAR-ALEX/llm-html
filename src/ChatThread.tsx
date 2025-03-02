import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { Container, ListGroup } from 'react-bootstrap';
import ChatBubble, { Message } from './ChatBubble';
import { LLMConfig } from './LLMConfig';
import { Property } from 'csstype';

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
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const spacerRef = useRef<HTMLDivElement>(null);
    const listGroupRef = useRef<HTMLDivElement>(null);
    const [flexDirection, setFlexDirection] = useState<Property.FlexDirection>('column-reverse');

    const overflowAnchor: Property.OverflowAnchor = supportsOverflowAnchor() ? 'auto' : 'none';
    //const overflowAnchor: Property.OverflowAnchor = 'none';

    const checkAtBottom = () => {
        if (containerRef.current) {   
            setFlexDirection((fd) => {         
                var distFromBottom = 0;
                if(fd === 'column-reverse') {
                    distFromBottom = Math.abs(containerRef.current.scrollTop); 
                }else{
                    distFromBottom = containerRef.current.scrollHeight - containerRef.current.clientHeight - containerRef.current.scrollTop;
                }
                var newVal: Property.FlexDirection = distFromBottom <= 5 ? 'column-reverse' : 'column';

                // if(!isLoading) newVal = 'column';

                if(fd !== newVal && newVal === "column") {
                    containerRef.current.style.flexDirection = 'column';
                    containerRef.current.scrollTop = containerRef.current.scrollHeight - containerRef.current.clientHeight - 15;
                }

                return newVal;
            });
    }};

    const listElems = messages.map((message, index) => (
        <ChatBubble
            key={index}
            index={index}
            sender={message.sender}
            content={message.content}
            onEdit={onEdit}
            onRefresh={onRefresh}
            onContinue={onContinue}
            isLoading={isLoading}
            isLast={index === messages.length - 1}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            llmConfig={llmConfig}
        />
    ));

    if(overflowAnchor === 'none'){
        useEffect(() => {
            checkAtBottom();
        }, [messages, isLoading]);
    }

    const handleScroll = useCallback(() => {
        checkAtBottom();
    }, [isLoading, messages]);

    return (
        <Container
            ref={containerRef}
            style={{
                height: '100%',
                overflowY: 'auto',
                marginTop: '10px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: flexDirection,
                overflowAnchor: overflowAnchor,
            }}
            onScroll={overflowAnchor === 'none' ? handleScroll : null}
        >
            <div style={{ flexDirection: 'column', flexGrow: 1 }}>
                <ListGroup ref={listGroupRef} style={{ flexDirection: 'column' }}>
                    {listElems}
                </ListGroup>
                <div ref={spacerRef} style={{ flexGrow: 1 }}></div> {/* Spacer div */}
            </div>
        </Container>
    );
};

export default memo(ChatThread);