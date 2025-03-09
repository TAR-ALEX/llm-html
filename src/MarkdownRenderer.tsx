import React, { memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from "@codemirror/lang-cpp";
import { githubDark } from '@uiw/codemirror-theme-github';
import 'katex/dist/katex.min.css';
import './prestyle.css'
import { Alert } from 'react-bootstrap';
import CollapsibleAlert from './CollapsibleAlert';
import { AppConfig } from './AppConfig';

// Create the memoized component
const MemoizedSyntaxHighlighter = React.memo<{segment: any}>(
  ({ segment }) => (
    <SyntaxHighlighter
      style={dracula}
      className="m-0 px-3 pb-3 pt-3"
      language={segment.language}
      PreTag="div"
      showLineNumbers={false}
    >
      {segment.content}
    </SyntaxHighlighter>
  )
);

// Create the memoized component
const MemoizedMarkdown = React.memo<{segment: any}>(
  ({ segment }) => (
    <Markdown
      remarkPlugins={[remarkGfm]}//remarkMath
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {segment.content.replace(/\n/g, '  \n')}
    </Markdown>
  )
);

function CodeCopyBtn({ code }: { code: string }) {
  const [copyOk, setCopyOk] = React.useState(false);
  const iconColor = copyOk ? '#0af20a' : '#ddd';

  const handleClick = () => {
    navigator.clipboard.writeText(code);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 500);
  };

  return (
    <div className="code-copy-btn">
      <i onClick={handleClick}>
        <FontAwesomeIcon icon={copyOk ? faCheck : faCopy} style={{ color: iconColor }} />
      </i>
    </div>
  );
}

type MarkdownRendererProps = {
  thinkingTokens?: {
    thinkingStart: string;
    thinkingEnd: string;
  }
  children: string;
  renderCodeEngine?: 'codemirror' | 'syntaxhighlighter' | 'none';
  appConfig?: AppConfig;
  isLast?: boolean;
};

function MarkdownRenderer({ thinkingTokens, children: markdown, appConfig, renderCodeEngine: mode = 'syntaxhighlighter', isLast}: MarkdownRendererProps) {
  const segments = parseMarkdown(markdown, thinkingTokens);
  //var bgColorCode = dracula["pre[class*=\"language-\"]"].background ?? "none";
  var bgColorCode = "#202230";
  var textColor = "#b7b7ba";
  return (
    <div>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          var titleDiv = null;
          if(segment.title ?? "" !== "") titleDiv = <div className="m-0 pt-2 ps-3 fs-5 py-2 fw-bold">{segment.title}</div>;
          return (
            <pre className="blog-pre mt-0 mb-2" key={`code-${index}`} style={{color: textColor, background: bgColorCode}}>
              {titleDiv}
              <CodeCopyBtn code={segment.content} />
              {mode === 'codemirror' ? (
                <Alert className="p-0" variant="dark">
                  <CodeMirror
                    value={segment.content}
                    theme={githubDark}
                    editable={false}
                    extensions={[getCodeMirrorExtension(segment.language)]}
                    basicSetup={{
                      lineNumbers: false, // Hide line numbers
                      foldGutter: false, // Disable folding gutter
                    }}
                  />
                </Alert>
              ) : (<></>)}
              {mode === 'syntaxhighlighter' ? (
                <MemoizedSyntaxHighlighter key={`code-${index}`} segment={segment}/>
              ) : (<></>)}
              {mode === 'none' ? (
                <Alert key={`code-${index}`} variant="dark">
                  <code>
                    {segment.content}
                  </code>
                </Alert>
              ) : (<></>)}
            </pre>
          );
        } else if (segment.type === 'thinking') {
          return (
            <CollapsibleAlert key={`code-${index}`} title='Thinking' variant="secondary" isOpenDefault={isLast?appConfig?.expandThinkingByDefault:false}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {segment.content.trim()}
              </div>
            </CollapsibleAlert>
          );
        } else {
          return (
            <MemoizedMarkdown key={`text-${index}`} segment={segment}/>
          );
        }
      })}
    </div>
  );
}

export default memo(MarkdownRenderer);

function parseMarkdown(
  markdown: string,
  thinkingTokens?: {
    thinkingStart: string;
    thinkingEnd: string;
  }
) {
  const segments: Array<{
    type: 'text' | 'code' | 'thinking';
    content: string;
    language?: string;
    title?: string;
  }> = [];

  let currentType: 'text' | 'code' | 'thinking' = 'text';
  let currentContent: string[] = [];
  let currentLanguage = '';
  let currentTitle = '';

  const flush = () => {
    if (currentContent.length > 0) {
      segments.push({
        type: currentType,
        content: currentContent.join('\n'),
        ...(currentType === 'code' ? { language: currentLanguage, title: currentTitle } : {}),
      });
      currentContent = [];
    }
  };

  const processLine = (line: string) => {
    if (currentType === 'text') {
      if (thinkingTokens && line.includes(thinkingTokens.thinkingStart)) {
        const [before, after] = splitAtMarker(line, thinkingTokens.thinkingStart);
        if (before) currentContent.push(before);
        flush();
        currentType = 'thinking';
        processLine(after);
      } else if (/^\s*```/.test(line)) {
        flush();
        currentType = 'code';
        var infoStr = line.trim().slice(3).trim();
        var firstSpaceIndex = infoStr.indexOf(' ');
        if(firstSpaceIndex <= 0){
          firstSpaceIndex = infoStr.trim().length;
        }
        currentLanguage = infoStr.substring(0,firstSpaceIndex) ?? 'text';
        currentTitle = infoStr.substring(firstSpaceIndex).trim() ?? "";
        currentTitle = currentTitle.replace(/^title=/, '');
        currentTitle = currentTitle.replace(/^file=/, '');
        currentTitle = currentTitle.replace(/^filename=/, '');
      } else {
        currentContent.push(line);
      }
    } else if (currentType === 'code') {
      if (/^\s*```/.test(line)) {
        flush();
        currentType = 'text';
        currentLanguage = '';
        currentTitle = '';
      } else {
        currentContent.push(line);
      }
    } else if (currentType === 'thinking') {
      if (thinkingTokens && line.includes(thinkingTokens.thinkingEnd)) {
        const [before, after] = splitAtMarker(line, thinkingTokens.thinkingEnd);
        currentContent.push(before);
        flush();
        currentType = 'text';
        processLine(after);
      } else {
        currentContent.push(line);
      }
    }
  };

  const splitAtMarker = (line: string, marker: string): [string, string] => {
    const index = line.indexOf(marker);
    if (index === -1) return [line, ''];
    return [line.slice(0, index), line.slice(index + marker.length)];
  };

  markdown.split('\n').forEach(processLine);
  flush();

  return segments;
}

function getCodeMirrorExtension(language: string) {
  switch (language) {
    case 'javascript':
      return javascript();
    case 'cpp':
      return cpp();
    default:
      return [];
  }
}