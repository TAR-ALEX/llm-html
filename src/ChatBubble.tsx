import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { ListGroup, Form, Button, ButtonGroup, Spinner } from 'react-bootstrap';
import MarkdownRenderer from './MarkdownRenderer';
import { getThinkingStartAndEnd, LLMConfig } from './LLMConfig';

export type Message = {
  sender: string;
  content: string;
};

interface ChatBubbleInterface {
  sender: string;
  content: string;
  index: number;
  onEdit: (index: number, content: string) => void;
  onRefresh: (index: number) => void;
  onContinue: (index: number) => void;
  isLoading: boolean;
  isLast: boolean;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  llmConfig?: LLMConfig;
}

const ChatBubble: React.FC<ChatBubbleInterface> = ({ sender, content, index, onEdit, onRefresh, onContinue, isLoading, isLast, editingIndex, setEditingIndex, llmConfig }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editedContent, setEditedContent] = useState(content);
  const isDisabled = isLoading || (editingIndex !== null && editingIndex !== index);
  const isEditing = editingIndex === index;
  const [oldEditHeight, setOldEditHeight] = useState(25);


  let thinkingTokens: { thinkingStart: string, thinkingEnd: string } | null = null;

  if (sender == "assistant" && llmConfig && llmConfig.thinking_escapes) {
    thinkingTokens = getThinkingStartAndEnd(llmConfig);
  }

  useEffect(() => {
    setOldEditHeight(0);
    if (isEditing && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [isEditing]);

  useEffect(() => {
    if (textAreaRef.current) {
      const textarea = textAreaRef.current;

      // Get the line height
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);

      // Set an approximate height based on the line count and line height
      let newHeight = oldEditHeight;

      if (textarea.scrollHeight === oldEditHeight) {
        return;
      }

      // Iterate to find the correct height
      while (newHeight > 0) {
        textarea.style.height = `${newHeight}px`;
        if (textarea.scrollHeight >= newHeight) {
          break;
        }
        newHeight -= lineHeight;
      }
      textarea.style.height = `${textarea.scrollHeight}px`;

      // Update the oldEditHeight for the next iteration
      setOldEditHeight(textarea.scrollHeight);
    }
  }, [editedContent, isEditing, oldEditHeight]);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleEditClick = useCallback(() => {
    setEditingIndex(index);
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [index, setEditingIndex]);

  const handleCancel = useCallback(() => {
    setEditingIndex(null);
    setEditedContent(content);
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [content, setEditingIndex]);

  const handleSave = useCallback(() => {
    onEdit(index, editedContent);
    setEditingIndex(null);
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [editedContent, index, onEdit, setEditingIndex]);

  const handleSaveAndContinue = useCallback(() => {
    handleSave();
    onContinue(index);
  }, [handleSave, index, onContinue]);

  const classMap = {
    system: 'text-warning-emphasis bg-warning-subtle border border-warning-subtle',
    user: 'text-primary-emphasis bg-primary-subtle border border-primary-subtle',
    assistant: 'text-secondary-emphasis bg-secondary-subtle border border-secondary-subtle'
  };

  return (
    <div
      className={`d-flex text-break justify-content-${sender === 'assistant' ? 'start' : 'end'} mb-2`}
      ref={containerRef}
      style={{ width: isEditing ? '100%' : 'auto' }}
    >
      <ListGroup.Item
        className={`${classMap[sender] ?? classMap.assistant} rounded p-3`}
        style={{ maxWidth: sender === 'system' ? '100%' : '80%', width: '100%' }}
      >
        {isEditing ? (
          <>
            <Form.Control
              as="textarea"
              ref={textAreaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="mb-2"
              style={{
                width: '100%',
                overflow: 'hidden', // Prevents scrolling
                resize: 'none', // Disables resizing
                minHeight: '10px', // Minimum height
                whiteSpace: 'pre-wrap', // Allows text wrapping
                overflowX: 'hidden', // Prevents horizontal scrolling
                wordWrap: 'break-word', // Breaks long words to fit
              }}
            />
            {/* <ButtonGroup className="d-flex justify-content-end gap-2"> */}
            <div className={`d-flex justify-content-${sender === 'user' ? 'end' : 'start'} gap-2 mt-2 align-items-center`}>
              <Button
                className='px-3'
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className='px-3'
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
              >
                Save
              </Button>
              {sender === 'assistant' ? (
                <Button
                  className='px-3'
                  variant="success"
                  size="sm"
                  onClick={handleSaveAndContinue}
                  disabled={isLoading}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  className='px-3'
                  variant="success"
                  size="sm"
                  onClick={() => {
                    handleSave();
                    onRefresh(index);
                  }}
                  disabled={isLoading}
                >
                  Send
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <MarkdownRenderer thinkingTokens={thinkingTokens}>{content}</MarkdownRenderer>
            <div className={`d-flex justify-content-${sender === 'user' ? 'end' : 'start'} gap-2 mt-2 align-items-center`}>
              <Button
                className='px-3'
                variant="outline-primary"
                size="sm"
                onClick={handleEditClick}
                disabled={isDisabled}
              >
                Edit
              </Button>
              <Button
                className='px-3'
                variant="outline-secondary"
                size="sm"
                onClick={() => onRefresh(index)}
                disabled={isDisabled}
              >
                {(isLoading && isLast) ?
                  <>
                    <Spinner className='me-2' as="span" animation="border" role="status" size="sm" />
                    Loading...
                  </>
                  : <>Refresh</>}
              </Button>

            </div>
          </>
        )}
      </ListGroup.Item>
    </div>
  );
}

export default memo(ChatBubble);