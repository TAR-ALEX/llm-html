import React, { useState } from 'react';
import { Offcanvas, Button } from 'react-bootstrap';

interface OffcanvasNavigatorProps {
  placement?: 'start' | 'end' | 'top' | 'bottom';
  responsive?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | string | undefined;
}

export interface OffcanvasNavigatorInstance {
  push: (component: React.ReactNode, options?: { style?: any, className?:any }) => void;
  pop: () => void;
  popAll: () => void;
}

const OffcanvasNavigator: React.ForwardRefRenderFunction<OffcanvasNavigatorInstance, OffcanvasNavigatorProps> = (
  { placement, responsive },
  ref
) => {
  const [show, setShow] = useState(false);
  const [stack, setStack] = useState<{component: React.ReactNode, options?: any}[]>([]);

  const push = (component: React.ReactNode, options?: { style?: any }) => {
    
    if(stack.length === 0){
        setStack((prevStack) => [...prevStack, {component: component, options: options}]);
        setShow(true);
    }else{
        setShow(false); // Hide the offcanvas first
        setTimeout(() => {
            setStack((prevStack) => [...prevStack, {component: component, options: options}]);
            setShow(true); // Show the offcanvas after 400 ms
        }, 400);
    }
  };

  const pop = () => {
    setShow(false);
    setTimeout(() => {
      setStack((prevStack) => prevStack.slice(0, -1));
      if (stack.length === 1) {
        setShow(false);
      } else {
        setShow(true);
      }
    }, 400);
  };

  const popAll = () => {
    setShow(false);
    setTimeout(() => {
        setStack([]);
    }, 400);
  };

  React.useImperativeHandle(ref, () => ({
    push,
    pop,
    popAll,
  }));

  return (
    <Offcanvas {...stack[stack.length - 1]?.options} show={show} onHide={popAll} placement={placement} responsive={responsive}>
      {stack[stack.length - 1]?.component}
    </Offcanvas>
  );
};

export default React.forwardRef(OffcanvasNavigator);