import { useState, useRef, useEffect, ReactNode } from 'react';
import { Alert, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleAlertProps {
  variant: string;
  title: string;
  children: ReactNode;
  isOpenDefault?: boolean;
}

const CollapsibleAlert: React.FC<CollapsibleAlertProps> = ({ variant, title, children, isOpenDefault }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault ?? false);
  const timeoutRef = useRef(null);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleToggle = () => {
    if (timeoutRef.current === null) {
      setIsOpen((prev) => !prev);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
      }, 600);
    }
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