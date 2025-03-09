import React, { useRef, useEffect, memo, useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { isMobile } from 'react-device-detect';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  children?: React.ReactNode;
};

function countNewlines(str) {
  const matches = str.match(/\r?\n/g);
  return matches ? matches.length : 0;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, onStop, isLoading, children }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [newlinesCount, setNewlinesCount] = useState(0);

  useEffect(() => {
    var resizeFunc = () => {
      if (inputRef.current) {
        const nlCount = countNewlines(value);
        if(countNewlines(value) != newlinesCount){
          inputRef.current.style.height = '70px';
          inputRef.current.style.height = `${Math.max(Math.min(inputRef.current.scrollHeight, 400), 70)}px`;
          setNewlinesCount(nlCount);
        }
        inputRef.current.style.height = `${Math.max(Math.min(inputRef.current.scrollHeight, 400), 70)}px`;
      }
    }
    resizeFunc();
  }, [value]);

  return (
    <Container className="d-flex gap-2" style={{ marginBottom: '10px' }}>
      <Form.Control
        ref={inputRef}
        as="textarea"
        placeholder="Type your message here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="overflow-y-auto flex-grow-1"
        style={{
          resize: 'none',
          minHeight: '0px',
          maxHeight: 'calc(33.333vh)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
            e.preventDefault();
            if (!isLoading) {
              onSend();
            }
          }
        }}
        autoFocus
      />
      <Button
        variant={isLoading ? 'danger' : 'primary'}
        onClick={isLoading ? onStop : onSend}
        disabled={!isLoading && !value.trim()}
        style={{ width: '100px' }}
      >
        {isLoading ? 'Stop' : 'Send'}
      </Button>
      {children}
    </Container>
  );
};

export default memo(ChatInput);