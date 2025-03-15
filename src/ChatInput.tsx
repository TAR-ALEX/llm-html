import React, { useRef, useEffect, memo, useState, useCallback } from 'react';
import { Form, Button, Container, Row, Col, Stack, Badge, CloseButton } from 'react-bootstrap';
import { isMobile } from 'react-device-detect';

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

function countNewlines(str: string) {
  const matches = str.match(/\r?\n/g);
  if(str.length == 0) return 0;
  return (matches?.length ?? 0) + 1;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onSend, onStop, isLoading, children }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [newlinesCount, setNewlinesCount] = useState(0);
  const [currentValue, setCurrentValue] = useState(value);
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);

  let sendWithFiles = useCallback((val:string) => {
    let result = '';
    files.forEach((file) => {
      let lang = getProgrammingLanguage(file.name);
      result += `\`\`\`${lang} filename=${file.name}\n${file.content}\n\`\`\`\n`;
    });
    result += val;
    console.log(result);
    onSend(result);
    setCurrentValue('');
    setFiles([]);
  }, [files, onSend]);

  useEffect(() => {
    var resizeFunc = () => {
      if (inputRef.current) {
        const nlCount = countNewlines(currentValue);
        if(countNewlines(currentValue) != newlinesCount){
          inputRef.current.style.height = '70px';
          inputRef.current.style.height = `${Math.max(Math.min(inputRef.current.scrollHeight, 400), 70)}px`;
          setNewlinesCount(nlCount);
        }
        inputRef.current.style.height = `${Math.max(Math.min(inputRef.current.scrollHeight, 400), 70)}px`;
      }
    }
    resizeFunc();
  }, [currentValue]);

  const handleDeleteFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (files.length > 0) {
        const readers = Array.from(files).map(file => {
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

        Promise.all(readers).then(results => {
            setFiles((f) => [
                ...f,
                ...results.map((content, index) => ({
                    name: files[index].name,
                    content: content,
                }))
            ]);
        }).catch(error => {
            console.error('Error reading files:', error);
        });
    }
};

  // const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   const items = e.clipboardData.items;
  //   for (let i = 0; i < items.length; i++) {
  //     if (items[i].type.indexOf('text') === -1) continue;
  //     const file = items[i].getAsFile();
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onload = (event) => {
  //         if (event.target && event.target.result) {
  //           setFiles((f) => [...f, { name: file.name, content: (event.target.result as string) }]);
  //         }
  //       };
  //       reader.readAsText(file);
  //     }
  //   }
  // };

  return (
    <Container 
      onDragOver={handleDragOver}
      onDrop={handleDrop} 
      // onPaste={handlePaste}
      className="d-flex gap-2" 
      style={{ marginBottom: '10px' }}
    >
      <Stack>
      <Stack direction="horizontal"gap={1}>
      {files.map((file) => (
        <h5>
        <Badge key={file.name} bg="secondary" className="mb-1">
        <Stack direction="horizontal">
          {file.name}
          <CloseButton
            onClick={() => handleDeleteFile(file.name)}
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
        onClick={isLoading ? onStop : () => {sendWithFiles(currentValue);}}
        disabled={!isLoading && !currentValue.trim()}
        style={{ width: '100px', height: '100%' }}
      >
        {isLoading ? 'Stop' : 'Send'}
      </Button>
      {children}
      </Stack>
      </Stack>
    </Container>
  );
  
};

export default memo(ChatInput);