import React, { useEffect, useState } from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { javascript } from '@codemirror/lang-javascript';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';

interface Props {
    original: string;
    modified: string;
    theme?: Extension;
    onDone: (merged: string) => void;
}

const MergeComponent: React.FC<Props> = ({ original, modified, onDone, theme = githubDark }) => {
    const [modifiedState, setModifiedState] = useState(modified);
    const [originalState, setOriginalState] = useState(original);
    //const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
    //const isDark = true;
    //localStorage.setItem('theme', isDark ? 'light' : 'dark');

    return (
        //<Container fluid className="d-flex flex-column vh-100 p-0">
        <Container>
            <Row>
                <Col>
                    <Button variant="danger" onClick={() => {
                        onDone(originalState);
                    }}>
                        Reject All
                    </Button>
                </Col>
                <Col>
                    <Button variant="success" onClick={() => {
                        onDone(modifiedState);
                    }}>
                        Accept All
                    </Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    <CodeMirrorMerge
                        destroyRerender={false}
                        orientation="a-b"
                        theme={theme}
                        collapseUnchanged={{ margin: 10 }}
                        revertControls='a-to-b'
                    >
                        <CodeMirrorMerge.Original
                            value={originalState}
                            onChange={(value: string, _viewUpdate: ViewUpdate) => { setOriginalState(value) }}
                            extensions={[EditorView.editable.of(true), EditorState.readOnly.of(false), javascript()]}
                        />
                        <CodeMirrorMerge.Modified
                            value={modifiedState}
                            onChange={(value: string, _viewUpdate: ViewUpdate) => { setModifiedState(value) }}
                            extensions={[EditorView.editable.of(true), EditorState.readOnly.of(false), javascript()]}
                        />
                    </CodeMirrorMerge>
                </Col>
            </Row>
        </Container>
    );
};

export default MergeComponent;