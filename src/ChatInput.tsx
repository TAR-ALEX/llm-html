import React, { useRef, useEffect, memo, useState, useCallback } from 'react';
import { Form, Button, Container, Stack, Badge, CloseButton, Spinner } from 'react-bootstrap';
import { isMobile } from 'react-device-detect';
import { v4 as uuidv4 } from 'uuid';
import SmoothResize from './SmoothResize';

const extensionMapping: { [key: string]: string } = {
  py: 'python',
  java: 'java',
  js: 'javascript',
  ts: 'typescript',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  rb: 'ruby',
  php: 'php',
  go: 'go',
  swift: 'swift',
  kt: 'kotlin',
  rs: 'rust',
  tsx: 'tsx',
  jsx: 'jsx',
  md: 'markdown',
  txt: 'text',
  yaml: 'yaml',
  xml: 'xml',
  sh: 'sh',
  sql: 'sql',
  pl: 'perl',
  r: 'r',
  h: 'c',
  hpp: 'cpp',
  m: 'objectivec',
  mm: 'objectivec++',
  csx: 'csharp',
  fs: 'fsharp',
  vb: 'vbnet',
  vbs: 'vbscript',
  ps1: 'powershell',
  psm1: 'powershell',
  psd1: 'powershell',
  ps1xml: 'powershell',
  xaml: 'xaml',
  xsl: 'xsl',
};

function getProgrammingLanguage(filename: string): string {
  const extension = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  return extensionMapping[extension] || 'text';
}

type ChatInputProps = {
  value: string;
  onSend: (value: string) => void;
  onStop: () => void;
  isLoading: boolean;
  children?: React.ReactNode;
};

const ChatInput: React.FC<ChatInputProps> = ({ value, onSend, onStop, isLoading, children }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [currentValue, setCurrentValue] = useState(value);
  const [files, setFiles] = useState<{ id: string; name: string; content: string }[]>([]);

  const sendWithFiles = useCallback(
    (val: string) => {
      let result = '';
      files.forEach((file) => {
        const lang = getProgrammingLanguage(file.name);
        result += `### ${file.name}\n\`\`\`${lang}\n${file.content}\n\`\`\`\n`;
      });
      result += val;
      onSend(result);
      setCurrentValue('');
      setFiles([]);
    },
    [files, onSend]
  );

  useEffect(() => {
    const resizeFunc = () => {
      if (inputRef.current) {
        inputRef.current.style.height = '70px';
        inputRef.current.style.height = `${Math.max(
          Math.min(inputRef.current.scrollHeight, 400),
          70
        )}px`;
      }
    };
    resizeFunc();
  }, [currentValue]);

  const handleDeleteFile = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processFiles = (fileList: FileList | File[]) => {
    const readers = Array.from(fileList).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readers)
      .then((results) => {
        setFiles((prevFiles) => [
          ...prevFiles,
          ...results.map((content, index) => ({
            id: uuidv4(),
            name: Array.from(fileList)[index].name,
            content: content,
          })),
        ]);
      })
      .catch((error) => {
        console.error('Error reading files:', error);
      });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const fileItems: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          fileItems.push(file);
        }
      }
    }
    if (fileItems.length > 0) {
      e.preventDefault();
      processFiles(fileItems);
    }
  };

  return (
    <SmoothResize
      disableAnimation={true}
      shrinkDebounceMs={25}
      style={{
        flexDirection: "column-reverse",
        display: "flex"
      }}
    >
      <Container
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="d-flex gap-2"
        style={{ paddingBottom: '10px' }}
      >
        <Stack className='px-0 mx-0'>
          <Stack direction="horizontal" gap={1} style={{ flexWrap: 'wrap' }}>
            {files.map((file) => (
              <h5 key={file.id}>
                <Badge bg="secondary-subtle" className="text-secondary-emphasis mb-1">
                  <Stack direction="horizontal">
                    {file.name}
                    <CloseButton
                      onClick={() => handleDeleteFile(file.id)}
                      aria-label={`Remove ${file.name}`}
                    />
                  </Stack>
                </Badge>
              </h5>
            ))}
          </Stack>
          <Stack direction="horizontal" gap={1}>
            <Form.Control
              ref={inputRef}
              as="textarea"
              placeholder="Type your message here..."
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onPaste={handlePaste}
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
                    sendWithFiles(currentValue);
                  }
                }
              }}
              autoFocus
            />
            <Button
              variant={isLoading ? 'danger' : 'primary'}
              onClick={isLoading ? onStop : () => sendWithFiles(currentValue)}
              disabled={!isLoading && !currentValue.trim()}
              style={{
                width: '100px',
                height: '100%',
                // border: "none",
                animation: isLoading ? 'pulseBtnStop 2.5s infinite ease-in-out' : 'none'
              }}
            >
              {isLoading ? (
                <>
                  <style>
                    {`
                      @keyframes pulseBtnStop {
                        0% { background-color: var(--bs-danger); }
                        50% { background-color: var(--bs-secondary); }
                        100% { background-color: var(--bs-danger); }
                      }
                    `}
                  </style>
                  Stop
                </>
              ) : 'Send'}
            </Button>
            {children}
          </Stack>
        </Stack>
      </Container>
    </SmoothResize>
  );
};

export default memo(ChatInput);