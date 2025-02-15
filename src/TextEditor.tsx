import React, { useEffect, useState } from 'react';
import CodeMirror, { Extension } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import {cpp} from "@codemirror/lang-cpp"
import { githubDark } from '@uiw/codemirror-theme-github';
import MergeComponent from './MergeComponent';
import {unifiedMergeView} from "@codemirror/merge"


interface Props {
    mainText: string;
    suggestedText?: string;
    theme?: Extension;
    onChange: (merged: string) => void;
}

const TextEditor: React.FC<Props> = ({ mainText, suggestedText, onChange, theme = githubDark }) => {
    const [suggestedTextState, setSuggestedTextState] = useState(suggestedText);
    const [mainTextState, setMainTextState] = useState(mainText);

    useEffect(() => {
        console.log('suggestedTextState updated:', suggestedTextState);
    }, [suggestedTextState]);
    
    // useEffect(() => {
    //     console.log('mainTextState updated:', mainTextState);
    // }, [mainTextState]);

    const injectedSyle = <style>
    {`
        .ͼ1 .cm-foldPlaceholder {
            background-color: transparent;
            border: none;
        }
    `}
    </style>;

    if (suggestedTextState == null || suggestedTextState === "") {
        return <>
        {injectedSyle}
        <CodeMirror value={mainTextState} theme={theme} extensions={[cpp(),unifiedMergeView({
          original: "one\n...\nfour"
        })]} onChange={(val: string) => {
            console.log('val:', val);
            onChange(val);
        }} />
        </>;//height="200px"
    } else {
        return <>
        {injectedSyle}
        <MergeComponent original={mainTextState} modified={suggestedTextState!} onDone={(val: string) => { setMainTextState(val); setSuggestedTextState(""); }} theme={theme} /></>;
    }
}

export default TextEditor;
