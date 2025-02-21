import React, { useState } from 'react';
import { Container, Form, Alert, Button, Accordion, Row, Col, Stack } from 'react-bootstrap';

const generateField = (field, value, handleChange, propsEnabled, onToggleEnabled) => {
  const enabled = field.optional ? propsEnabled : true;

  const commonProps = {
    name: field.name,
    value: value,
    onChange: (forwaredParams) => {handleChange(field.type, forwaredParams);},
    disabled: !enabled
  };

  const isInvalid = enabled && (
    (field.type === "number" && (
      (typeof value !== "number" && isNaN(value)) ||
      (field.min !== undefined && value < field.min) ||
      (field.max !== undefined && value > field.max)
    )) ||
    (field.type === "json" && (
      (() => {
        try {
          JSON.parse(value);
          return false; // Valid JSON
        } catch (e) {
          return true; // Invalid JSON
        }
      })()
    ))
  );

  const FieldLabel = () => (
    <div className="d-flex align-items-center mb-2">
      {field.optional && (
        <Form.Check
          type="switch"
          checked={enabled}
          onChange={onToggleEnabled}
          id={`enable-${field.name}`}
          className="me-2"
        />
      )}
      <Form.Label htmlFor={field.optional ? `enable-${field.name}` : undefined} className="mb-0">
        {field.label}
      </Form.Label>
    </div>
  );

  switch (field.type) {
    case 'slider':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Row>
            <Col xs={8}>
              <Form.Range
                min={field.min}
                max={field.max}
                step={field.step || 1}
                className="mt-2"
                {...commonProps}
              />
            </Col>
            <Col xs={4}>
              <Form.Control
                type="number"
                step={field.step || 1}
                min={field.min}
                max={field.max}
                isInvalid={isInvalid}
                className="ms-2"
                {...commonProps}
              />
            </Col>
          </Row>
          {field.description && (
            <Form.Text className="text-muted d-block mt-2">
              {field.description} {field.min !== undefined && field.max !== undefined &&
                `(Range: ${field.min} to ${field.max})`}
            </Form.Text>
          )}
          {isInvalid && (
            <Form.Control.Feedback type="invalid" className="d-block">
              {field.min !== undefined && field.max !== undefined
                ? `Value must be between ${field.min} and ${field.max}`
                : field.min !== undefined
                  ? `Value must be ≥ ${field.min}`
                  : field.max !== undefined
                    ? `Value must be ≤ ${field.max}`
                    : "Invalid value"}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      );
    case 'number':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Control
            type="number"
            step={field.step || 1}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            isInvalid={isInvalid}
            {...commonProps}
          />
          {field.description && (
            <Form.Text className="text-muted">
              {field.description} {field.min !== undefined && field.max !== undefined &&
                `(Range: ${field.min} to ${field.max})`}
            </Form.Text>
          )}
          {isInvalid && (
            <Form.Control.Feedback type="invalid">
              {field.min !== undefined && field.max !== undefined
                ? `Value must be between ${field.min} and ${field.max}`
                : field.min !== undefined
                  ? `Value must be ≥ ${field.min}`
                  : field.max !== undefined
                    ? `Value must be ≤ ${field.max}`
                    : "Invalid value"}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      );
    case 'boolean':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Select
            onChange={(e) => onChange(e.target.value === 'true')}
            {...commonProps}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </Form.Select>
          {field.description && (
            <Form.Text className="text-muted">{field.description}</Form.Text>
          )}
        </Form.Group>
      );
    case 'switch':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Check
            type="switch"
            checked={value}
            {...commonProps}
          />
          {field.description && (
            <Form.Text className="text-muted">{field.description}</Form.Text>
          )}
        </Form.Group>
      );
    case 'textarea':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Control
            as="textarea"
            placeholder={field.placeholder}
            {...commonProps}
          />
          {field.description && (
            <Form.Text className="text-muted">{field.description}</Form.Text>
          )}
        </Form.Group>
      );
    case 'json':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Control
            as="textarea"
            placeholder={field.placeholder}
            {...commonProps}
            isInvalid={isInvalid}
          />
          {field.description && (
            <Form.Text className="text-muted">{field.description}</Form.Text>
          )}
          {isInvalid && (
            <Form.Control.Feedback type="invalid">
              Invalid JSON
            </Form.Control.Feedback>
          )}
        </Form.Group>
      );
    case 'text':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Control
            type="text"
            placeholder={field.placeholder}
            {...commonProps}
          />
          {field.description && (
            <Form.Text className="text-muted">{field.description}</Form.Text>
          )}
        </Form.Group>
      );
    case 'select':
      return (
        <Form.Group className="mb-3" key={field.name}>
          <FieldLabel />
          <Form.Select {...commonProps}>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          {field.description && (
            <Form.Text className="text-muted">{field.description}</Form.Text>
          )}
        </Form.Group>
      );
    default:
      return null;
  }
};

const FormComponent = ({ formConfig = [], initialState = {}, onSubmit, onDuplicate, onCancel }) => {
  const getType = Object.fromEntries(
    formConfig.flatMap(section =>
      section.fields
        .map(field => [field.name, field.type])
        .filter(error => error !== null)
    )
  );

  // Merge provided initialState with defaults from formConfig
  const computedInitialState = formConfig.reduce((acc, section) => {
    section.fields.forEach(field => {
      // Only set default if the field isn't in initialState
      if (acc[field.name] === undefined) {
        acc[field.name] = field.placeholder !== undefined ? field.placeholder : '';
      }else if(getType[field.name] === 'json'){
        // if(acc[field.name] !== '') acc[field.name] = JSON.stringify(acc[field.name], null, 2);
        if(acc[field.name] !== '') acc[field.name] = JSON.stringify(acc[field.name]);
      }
    });
    return acc;
  }, { ...initialState }); // Start with a copy of the provided initialState

  const [formData, setFormData] = useState(computedInitialState);
  const [errors, setErrors] = useState([]);
  const [enabledFields, setEnabledFields] = useState(() => {
    const initialEnabled = {};
    formConfig.forEach(section => {
      section.fields.forEach(field => {
        // Check if computedInitialState has a value and use it to determine the enabled state
        if (initialState[field.name] !== undefined) {
          initialEnabled[field.name] = true;
        } else {
          // Fallback to the original logic
          if (field.optional && (field.defaultValue === '' || field.defaultValue === undefined || field.defaultValue === null)) {
            initialEnabled[field.name] = false;
          } else {
            initialEnabled[field.name] = true;
          }
        }
      });
    });
    return initialEnabled;
  });

  const handleChange = (type, e) => {
    const { name, value, checked } = e.target;
    //var val = type === 'checkbox' ? checked : ((type === "number" || type === 'slider') ? Number(value) : value);

    var val;

    console.log(type);

    if (type === 'checkbox') {
      val = checked;
    } else if (type === 'number' || type === 'slider') {
      val = Number(value);
    } else if (type === 'json') {
      val = value;
    } else {
      val = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleToggleEnabled = (fieldName) => (e) => {
    // Only update state for optional fields
    const field = formConfig
      .flatMap(s => s.fields)
      .find(f => f.name === fieldName);

    if (field?.optional) {
      setEnabledFields(prev => ({
        ...prev,
        [fieldName]: e.target.checked
      }));
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const validateField = (field, value) => {
    if (!enabledFields[field.name]) return null;
    if (field.type === 'number' || field.type === 'slider') {
      const numValue = Number(value);
      if (field.min !== undefined && numValue < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return `${field.label} must be at most ${field.max}`;
      }
    }
    if (field.type === 'json') {
      try{
        JSON.parse(value);
      }catch(e){
        return `Invalid JSON: ${e}`;
      }
    }
    return null;
  };

  const computeResult = () => {
    // Validate fields and collect errors
    const newErrors = formConfig.flatMap(section =>
      section.fields
        .map(field => validateField(field, formData[field.name]))
        .filter(error => error !== null)
    );

    setErrors(newErrors);
    if (newErrors.length > 0) return;

    // Process form data, excluding disabled fields and adding enabled flags
    var filteredData = Object.keys(formData).reduce((acc, key) => {
      if (enabledFields[key] && formData[key] !== null) {
          acc[key] = formData[key];
      }
      return acc;
    }, {});

    filteredData = Object.keys(filteredData).reduce((acc, key) => {
      if(getType[key] == 'json'){
        try{
          acc[key] = JSON.parse(filteredData[key]);
          console.log("pared json:", acc[key]);
        }catch(error){
          console.error(error);
        }
      }else if(getType[key] == 'boolean'){
        try{
          acc[key] = Boolean(filteredData[key]);
        }catch(error){
          acc[key] = false;
        }
      }else{
        acc[key] = filteredData[key];
      }
      return acc;
    }, {});

    // Ensure all initialState fields exist in filteredData
    Object.keys(initialState).forEach(key => {
      if (!(key in filteredData) && !(key in enabledFields)) {
        filteredData[key] = initialState[key];
      }
    });
    return filteredData;
  }

  const handleSaveDup = () => {
    let result = computeResult();
    console.log('made dup config:', result, enabledFields);
    onDuplicate(result);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    let result = computeResult();
    console.log('saved config:', result, enabledFields);
    onSubmit(result);
  };


  return (
    <Form className="h-100 d-flex flex-column" onSubmit={handleSubmit} noValidate>
      <Container fluid className='overflow-auto h-100 m-0 p-0'>
        <Container fluid className='m-0 p-0'>
          <Accordion defaultActiveKey="0" alwaysOpen>
            {formConfig.map((section, index) => (
              <Accordion.Item eventKey={index.toString()} key={section.label}>
                <Accordion.Header>{section.label}</Accordion.Header>
                <Accordion.Body>
                  <Row>
                    {section.fields.map(field => (
                      <Col sm={12} lg={6} xxl={4} key={field.name}>
                        {generateField(
                          field,
                          formData[field.name],
                          handleChange,
                          enabledFields[field.name],
                          handleToggleEnabled(field.name)
                        )}
                      </Col>
                    ))}
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </Container>

      {errors.length > 0 && (
        <Alert variant="danger" dismissible onClose={() => setErrors([])}>
          <Alert.Heading>Validation Errors:</Alert.Heading>
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

    <Stack direction="horizontal" className="mt-3" gap={2}>
      <Button variant="primary" type="submit">
        Save
      </Button>
      <Button variant="warning" onClick={handleSaveDup}>
        Save Copy
      </Button>
      <Button variant="secondary" onClick={handleCancel}>
        Cancel
      </Button>
    </Stack>
    </Form>
  );
};

export default FormComponent;