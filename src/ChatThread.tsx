import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { Container, ListGroup } from 'react-bootstrap';
import ChatBubble, { Message } from './ChatBubble';
import { LLMConfig } from './LLMConfig';

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
    const listGroupRef = useRef<HTMLDivElement>(null);
    const [isListGroupSmaller, setIsListGroupSmaller] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const containerHeight = containerRef.current?.clientHeight || 0;
            const listGroupHeight = listGroupRef.current?.clientHeight || 0;
            const isSmaller = listGroupHeight < containerHeight;
            setIsListGroupSmaller(isSmaller);
        };

        // Initial check
        handleResize();

        // Add event listener for resize
        window.addEventListener('resize', handleResize);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [messages]);

    var listElems = messages.map((message, index) => (
        <ChatBubble
            key={index}
            index={index}
            sender={message.sender}
            content={message.content}
            onEdit={onEdit}
            onRefresh={onRefresh}
            onContinue={onContinue}
            isLoading={isLoading}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            llmConfig={llmConfig}
        />
    ));
    if (!isListGroupSmaller) {
        listElems = listElems.reverse();
    }

    return (
        <Container
            ref={containerRef}
            style={{
                height: '100%',
                overflowY: 'auto',
                marginTop: '10px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: isListGroupSmaller ? 'column' : 'column-reverse',
            }}
        >
            <ListGroup ref={listGroupRef} style={{ flexDirection: isListGroupSmaller ? 'column' : 'column-reverse' }}>
                {listElems}
            </ListGroup>
        </Container>
    );
};

export default memo(ChatThread);