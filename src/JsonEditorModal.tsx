import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

interface JsonEditorModalProps {
  show: boolean;
  onHide: () => void;
  jsonValue: string;
  onSave: (value: string) => void;
  title: string;
  validateJson?: (jsonString: string) => string[]; // New callback for custom validation
  readonly?: boolean; // New readonly flag
}

const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  show,
  onHide,
  jsonValue,
  onSave,
  title,
  validateJson,
  readonly = false, // Default to false if not provided
}) => {
  const [localJsonValue, setLocalJsonValue] = useState(jsonValue);
  const [jsonErrors, setJsonErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalJsonValue(jsonValue);
  }, [jsonValue]);

  useEffect(() => {
    try {
      JSON.parse(localJsonValue);
      setJsonErrors([]);
      
      // Run custom validation if provided
      if (validateJson) {
        const customErrors = validateJson(localJsonValue);
        setValidationErrors(customErrors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setJsonErrors([error.message]);
      setValidationErrors([]);
    }
  }, [localJsonValue, validateJson]);

  const handleSave = () => {
    if (jsonErrors.length === 0 && validationErrors.length === 0) {
      onSave(localJsonValue);
    }
  };

  const allErrors = [...jsonErrors, ...validationErrors];

  return (
    <Modal show={show} fullscreen={"xl-down"} onHide={onHide} size="xl">
      <div style={{
        minHeight: 'calc(100dvh - 100px)',
        display: "flex",
        flexDirection: "column",
        flexGrow: 1
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='d-flex flex-grow-1 flex-shrink-0 flex-column'>
          <Form.Control
            as="textarea"
            rows={3}
            value={localJsonValue}
            onChange={(e) => !readonly && setLocalJsonValue(e.target.value)}
            style={{
              fontFamily: 'monospace',
              flex: "1 0 0%",
              resize: 'none'
            }}
            className={allErrors.length > 0 ? 'border-danger' : ''}
            readOnly={readonly}
          />
          {allErrors.length > 0 && (
            <Alert variant="danger" className="mb-0 mt-1">
              <Alert.Heading>JSON Validation Errors:</Alert.Heading>
              <ul className="mb-0">
                {allErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          {!readonly && (
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={allErrors.length > 0}
            >
              Save
            </Button>
          )}
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default JsonEditorModal;