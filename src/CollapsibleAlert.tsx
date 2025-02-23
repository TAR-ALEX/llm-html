import React, { useState } from 'react';
import { Alert, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';

const CollapsibleAlert = ({ variant, title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <Alert className="bg-transparent mx-0 mt-0" variant={variant} style={{ padding: 0 }}>
      {/* Clickable header */}
      <div
        onClick={handleToggle}
        className="d-flex align-items-center px-2 py-1 m-0"
        style={{ cursor: 'pointer' }}
      >
        <span style={{ width: '20px', display: 'inline-flex', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={isOpen ? faCaretDown : faCaretRight} />
        </span>
        <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>{title}</span>
      </div>

      {/* Conditionally render the separator line only when expanded */}
      {isOpen && <div className={`border-top border-${variant}-subtle`} />}

      {/* Collapsible body */}
      <Collapse in={isOpen}>
        <div className="p-0">
          <div className="p-2">
            {children}
          </div>
        </div>
      </Collapse>
    </Alert>
  );
};

export default CollapsibleAlert;