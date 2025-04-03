import React, { useState } from 'react';
import { Button, Container, Form, Modal, Row } from 'react-bootstrap';
import FormComponent from './FormComponent';
import { JSX } from 'react/jsx-runtime';
import JsonEditorModal from './JsonEditorModal';

interface AppConfigFormProps {
  initialState: any; // Replace 'any' with the actual type if known
  onSubmit: (data: any) => void; // Replace 'any' with the actual type if known
  onCancel: () => void;
}

// Testing component
const AppConfigForm: React.FC<AppConfigFormProps> = ({ initialState, onSubmit, onCancel }) => {
  return (
    <Container fluid className="h-100 d-flex flex-column">
      <Row className="flex-grow-1 overflow-auto"><FormComponent formConfig={AppConfigSchema} initialState={initialState} onSubmit={onSubmit} onCancel={onCancel} /></Row>
    </Container>
  )
};

export default AppConfigForm;

const AppConfigSchema = [
  {
    label: 'General Settings',
    fields: [
      {
        name: 'showSystemPrompt',
        label: 'Show System Prompt',
        type: 'boolean',
        placeholder: true,
        description: 'shortname the system prompt like a message',
      },
      {
        name: 'expandThinkingByDefault',
        label: 'Expand Thinking By Default',
        type: 'boolean',
        placeholder: false,
        description: 'expand the thinking by default',
      },
      {
        name: 'replaceSystemPromptOnConfigChange',
        label: 'Replace System Prompt On Config Change',
        type: 'boolean',
        placeholder: true,
        description: 'Replace System Prompt On Config Change',
      },
      {
        name: 'wideAssistantMessages',
        label: 'Wide Assistant Messages',
        type: 'boolean',
        placeholder: true,
        description: 'Wide Assistant Messages take up 100% of the space',
      },
      {
        name: 'borderAssistantMessages',
        label: 'Assistant Messages Border',
        type: 'boolean',
        placeholder: true,
        description: 'Assistant Messages have a secondary color border',
      },
      {
        name: 'markdownForUserMessages',
        label: 'Use Markdown for User Messages',
        type: 'boolean',
        placeholder: true,
        description: 'User messages will be rendered as markdown text',
      },
      {
        name: 'theme',
        label: 'Theme',
        type: 'select',
        placeholder: 0,
        options: [
          { value: 0, label: 'auto' },
          { value: 1, label: 'dark' },
          { value: 2, label: 'light' }
        ]
      },
    ],
  },
  {
    label: 'Other Parameters',
    fields: [
      {
        name: 'smoothAnimations',
        label: 'Use Animations',
        type: 'boolean',
        placeholder: false,
        description: 'Animations can break scroll anchoring in some browsers',
      },
    ]
  },
  {
    label: 'Import and Export',
    fields: [
      {
        name: 'btnEditLocalcache',
        label: 'localcache',
        type: 'button',
        variant: "danger",
        description: 'Button to view the localcache (for debugging)',
        onClick: (setModal: (arg0: JSX.Element) => void, hideModal: () => void) => {
          const localStorageToJsonString = () => {
            const storageObject = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              const value = localStorage.getItem(key);
              try {
                storageObject[key] = JSON.parse(value);
              } catch (e) {
                storageObject[key] = value; // In case the value is not a valid JSON string
              }
            }
            return JSON.stringify(storageObject, null, 2);
          };
          
          const storageString = localStorageToJsonString();
          setModal(
            <JsonEditorModal
              show={true}
              readonly={true}
              onHide={() => hideModal()}
              jsonValue={storageString}
              title="localcache"
              onSave={function (): void {
                alert('Function not implemented.');
                hideModal();
                throw new Error('Function not implemented.');
              }}
            />
          );
        }
      }
    ]
  }
];