import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  PropsWithChildren,
  CSSProperties,
} from 'react';

interface SmoothResizeProps extends PropsWithChildren<{}> {
  /** Debounce time in milliseconds before starting shrinkage animation/update. Default: 25 */
  shrinkDebounceMs?: number;
  /** Duration of the height transition animation in milliseconds (used only if animation is enabled). Default: 150 */
  transitionDurationMs?: number;
  /** CSS transition timing function (used only if animation is enabled). Default: 'ease-out' */
  transitionTimingFunction?: string;
  /** Minimum change in pixels required to trigger a height update. Default: 1 */
  updateThresholdPx?: number;
  /** Minimum shrinkage in pixels required to trigger a height reduction. Default: 5 */
  shrinkThresholdPx?: number;
  /** If true, disable the smooth height transition animation. Height changes will be instant (respecting shrink debounce). Default: false */
  disableAnimation?: boolean;
  /** Optional additional style for the outer wrapper */
  style?: CSSProperties;
  /** Optional className for the outer wrapper */
  className?: string;
}

export const SmoothResize: React.FC<SmoothResizeProps> = ({
  children,
  shrinkDebounceMs = 50,
  transitionDurationMs = 250,
  transitionTimingFunction = 'ease-out',
  updateThresholdPx = 1,
  shrinkThresholdPx = 10,
  disableAnimation = true,
  style = {},
  className,
}) => {
  const [currentHeight, setCurrentHeight] = useState<number | 'auto'>('auto');
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const shrinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const isInitialMountRef = useRef(true);
  const lastMeasuredHeightRef = useRef<number | null>(null);

  // Use useLayoutEffect for initial measurement to avoid flicker
  useLayoutEffect(() => {
    if (innerRef.current) {
      const initialHeight = innerRef.current.offsetHeight;
      setCurrentHeight(initialHeight);
      lastMeasuredHeightRef.current = initialHeight;
      // Set initial mount flag to false *after* first measurement and state update
      requestAnimationFrame(() => {
        isInitialMountRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleResize = (newHeight: number) => {
    setCurrentHeight((prevHeight) => {
      if (shrinkTimeoutRef.current) {
        clearTimeout(shrinkTimeoutRef.current);
        shrinkTimeoutRef.current = null;
      }

      // Use 'number' check for prevHeight as initial state is 'auto'
      const prevNumericHeight = typeof prevHeight === 'number' ? prevHeight : 0;

      if (prevHeight === 'auto' || newHeight >= prevNumericHeight) {
        // Growing or initial: Update target height immediately
        return newHeight;
      } else {
        // Check if shrinkage is below threshold
        const shrinkageAmount = prevNumericHeight - newHeight;
        if (shrinkageAmount <= shrinkThresholdPx) {
          // Ignore small shrinkage - keep previous height
          return prevHeight;
        }
        
        // Shrinking: Schedule update after debounce
        shrinkTimeoutRef.current = setTimeout(() => {
          if (innerRef.current) {
            setCurrentHeight(newHeight);
          }
        }, shrinkDebounceMs);
        // Return previous height while waiting for debounce timeout
        return prevHeight;
      }
    });
  };

  useEffect(() => {
    const innerElement = innerRef.current;
    if (!innerElement) return;

    const MIN_HEIGHT_CHANGE_PX = updateThresholdPx;

    observerRef.current = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || isInitialMountRef.current) {
        return;
      }
      const entry = entries[0];
      const newHeight = entry.target.scrollHeight;

      const heightChangedSignificantly =
        lastMeasuredHeightRef.current === null ||
        Math.abs(newHeight - lastMeasuredHeightRef.current) >= MIN_HEIGHT_CHANGE_PX;

      if (heightChangedSignificantly) {
        lastMeasuredHeightRef.current = newHeight;
        handleResize(newHeight);
      }
    });

    observerRef.current.observe(innerElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (shrinkTimeoutRef.current) {
        clearTimeout(shrinkTimeoutRef.current);
        shrinkTimeoutRef.current = null;
      }
    };
  }, [shrinkDebounceMs, updateThresholdPx, shrinkThresholdPx]);

  // Determine the transition style based on props and initial mount state
  const transitionStyle =
    isInitialMountRef.current || disableAnimation
      ? 'none'
      : `height ${transitionDurationMs}ms ${transitionTimingFunction}`;

  const outerStyle: CSSProperties = {
    ...style,
    height: currentHeight === 'auto' ? 'auto' : `${currentHeight}px`,
    transition: transitionStyle,
    contain: 'paint',
  };

  return (
    <div
      ref={outerRef}
      style={outerStyle}
      className={className}
    >
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  );
};

export default SmoothResize;