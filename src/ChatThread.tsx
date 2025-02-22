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
            isLast={index === messages.length-1}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            llmConfig={llmConfig}
        />
    ));

    return (
        <Container
            ref={containerRef}
            style={{
                height: '100%',
                overflowY: 'auto',
                marginTop: '10px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column-reverse',
            }}
        >
            <div style={{ flexGrow: 1 }}></div> {/* Spacer div */}
            <ListGroup ref={listGroupRef} style={{ flexDirection: 'column' }}>
                {listElems}
            </ListGroup>
        </Container>
    );
};

export default memo(ChatThread);