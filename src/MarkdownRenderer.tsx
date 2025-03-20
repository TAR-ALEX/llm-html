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

// Configure remarkMath to disable single dollar text math
const remarkMathConfig = {
  singleDollarTextMath: false
};

// Create the memoized component
const MemoizedSyntaxHighlighter = React.memo<{segment: any}>(
  ({ segment }) => (
    <SyntaxHighlighter
      style={{
        ...dracula, 
      }}
      className="m-0 px-3 pb-3 pt-3 rounded-0"
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
      remarkPlugins={[remarkGfm, [remarkMath, remarkMathConfig]]}
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
  sender?: string;
  appConfig?: AppConfig;
  isLast?: boolean;
};

function MarkdownRenderer({ thinkingTokens, children: markdown, appConfig, sender: sender, renderCodeEngine: mode = 'syntaxhighlighter', isLast}: MarkdownRendererProps) {
  const segments = parseMarkdown(markdown, thinkingTokens);
  // var bgColorCode = dracula["pre[class*=\"language-\"]"].background ?? "none";
  var bgColorHat = "#202230";
  var textColor = "#b7b7ba";
  return (
    <div>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          var titleDiv = null;
          // segment.title = "Test";
          if(segment.title ?? "" !== "") titleDiv = <div className="p-0 pe-2 fw-bold">{segment.title}</div>;
          return (
            <div className="blog-pre mt-0 mb-2" key={`code-${index}`}>{/*style={{color: textColor, background: bgColorHat}}*/}
              {
                (titleDiv) ? (
                  <div className="d-flex px-2 align-items-center justify-content-between code-header-style" style={{color: textColor, background: bgColorHat, paddingTop:"0.2em", paddingBottom:"0.2em",}}>
                    {titleDiv}                
                    <CodeCopyBtn code={segment.content} />
                  </div>
                ) : (
                  <div style={{height: "100%",  position: "absolute", right: "0px", top: "0px"}}>
                    <div className="px-2" style={{position: "sticky", paddingTop:"0.2em", paddingBottom:"0.2em", top: "0px", right: "0px", display: "inline-block"}}>{/*, background: bgColorCode, boxShadow: `${bgColorCode} 0px 0px 5px 5px`*/}
                    <CodeCopyBtn code={segment.content} />
                    </div>
                  </div>
                )
              }
              
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
            </div>
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
          if((appConfig.markdownForUserMessages ?? false) || sender === 'assistant'){
            return (
              <MemoizedMarkdown key={`text-${index}`} segment={segment}/>
            );
          }else{
          return( <div key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
            {segment.content}
          </div>);
          }
          
        }
      })}
    </div>
  );
}

export default memo(MarkdownRenderer);

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseMarkdown(
  markdown: string,
  thinkingTokens?: {
    thinkingStart: string;
    thinkingEnd: string;
  }
) {
  const segments: Array<{
    type: string;
    content: string;
    language?: string;
    title?: string;
  }> = [];

  // Build our generic block definitions.
  const regexBlockTypes: Array<{
    blockType: string;
    regexStart:  Array<RegExp>;
    regexEnd:  Array<RegExp>;
  }> = [];

  // If thinking tokens are provided, add a thinking block.
  if (thinkingTokens) {
    regexBlockTypes.push({
      blockType: 'thinking',
      regexStart: [new RegExp(escapeRegExp(thinkingTokens.thinkingStart), 'gm')],
      regexEnd: [new RegExp(escapeRegExp(thinkingTokens.thinkingEnd), 'gm')],
    });
  }

  // Always include a code block type.
  // Using named capture groups to extract "language" and "filename" if provided.
  regexBlockTypes.push({
    blockType: 'code',
    regexStart: [
      /(?:\#\#\#\s(?<filename>[\S]+)\n)?```\s*?(?<language>\w+)?\n/gm, 
      /```\s*?(?<language>\w+)?(?:\s+filename=(?<filename>[\S]+))?\n/gm
    ],
    regexEnd: [/\n\s*```/gm],
  });

  let pos = 0;
  while (pos < markdown.length) {
    let earliestIndex: number | null = null;
    let selectedBlock: typeof regexBlockTypes[0] | null = null;
    let startMatch: RegExpExecArray | null = null;

    // Find the next block start among our block types.
    for (const block of regexBlockTypes) {
      block.regexStart[0].lastIndex = pos;
      const match = block.regexStart[0].exec(markdown);
      if (match && (earliestIndex === null || match.index < earliestIndex)) {
        earliestIndex = match.index;
        selectedBlock = block;
        startMatch = match;
      }
    }

    // If no block was found, push the remaining text and exit.
    if (earliestIndex === null || selectedBlock === null) {
      if (pos < markdown.length) {
        segments.push({
          type: 'text',
          content: markdown.slice(pos),
        });
      }
      break;
    }

    // Push any text before the block as a plain text segment.
    if (earliestIndex > pos) {
      segments.push({
        type: 'text',
        content: markdown.slice(pos, earliestIndex),
      });
    }

    // Determine the end of this block.
    const startTokenEnd = selectedBlock.regexStart[0].lastIndex;
    selectedBlock.regexEnd[0].lastIndex = startTokenEnd;
    const endMatch = selectedBlock.regexEnd[0].exec(markdown);
    let blockContent: string;
    let endIndex: number;

    if (endMatch) {
      // Block is closed properly.
      blockContent = markdown.slice(startTokenEnd, endMatch.index);
      endIndex = selectedBlock.regexEnd[0].lastIndex;
    } else {
      // Block is not closed; capture until the end.
      blockContent = markdown.slice(startTokenEnd);
      endIndex = markdown.length;
    }

    // Build the segment.
    if (selectedBlock.blockType === 'code') {
      const groups = startMatch.groups || {};
      segments.push({
        type: selectedBlock.blockType,
        content: blockContent,
        language: groups.language ? groups.language.trim() : undefined,
        title: groups.filename ? groups.filename.trim() : undefined,
      });
    } else {
      segments.push({
        type: selectedBlock.blockType,
        content: blockContent,
      });
    }

    pos = endIndex;
  }

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