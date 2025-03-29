import React, {
  useRef,
  useEffect,
  useState,
  ReactNode,
  CSSProperties
} from 'react';

interface ScrollViewProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  stickThreshold?: number; // Threshold used by IntersectionObserver margin
  forceStick?: boolean;
  stickToBottom?: boolean; // New prop to force sticking to bottom regardless of scroll position
}

const DEFAULT_STICK_THRESHOLD = 5;
const SCROLL_POSITION_TOLERANCE = 35; // How close to bottom we consider "at bottom"

const ScrollView: React.FC<ScrollViewProps> = ({
  children,
  className,
  style,
  stickThreshold = DEFAULT_STICK_THRESHOLD,
  forceStick = false,
  stickToBottom = false, // Default to false for backward compatibility
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomMarkerRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<ReactNode>(children);
  const prevScrollHeightRef = useRef<number>(0);
  const wasAtBottomRef = useRef<boolean>(true);

  // State to track if the bottom marker is considered "visible"
  const [isMarkerVisible, setIsMarkerVisible] = useState(true);

  // Check if browser supports scroll anchoring
  const supportsScrollAnchoring = 'overflowAnchor' in document.body.style;

  // Store latest props in refs for observer callback access
  const latestStickThresholdRef = useRef(stickThreshold);
  const latestForceStickRef = useRef(forceStick);
  useEffect(() => {
    latestStickThresholdRef.current = stickThreshold;
    latestForceStickRef.current = forceStick;
  }, [stickThreshold, forceStick]);

  // Track scroll position and whether we're at/near bottom
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) <= SCROLL_POSITION_TOLERANCE;
      wasAtBottomRef.current = isAtBottom;
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle content changes and implement fallback scrolling if needed
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return;

    const prevScrollHeight = prevScrollHeightRef.current;
    const currentScrollHeight = scrollElement.scrollHeight;
    const heightDifference = currentScrollHeight - prevScrollHeight;

    // If content grew and we were at/near the bottom or forceStick is true
    if (heightDifference > 0 && (wasAtBottomRef.current || forceStick || stickToBottom)) {
      // Only manually scroll if scroll anchoring isn't supported or isn't working
      if (!supportsScrollAnchoring || !isMarkerVisible) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }

    prevScrollHeightRef.current = currentScrollHeight;
    childrenRef.current = children;
  }, [children, forceStick, stickToBottom, supportsScrollAnchoring, isMarkerVisible]);

  // --- Effect for Intersection Observer ---
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    const markerElement = bottomMarkerRef.current;

    if (!scrollElement || !markerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMarkerVisible(entry.isIntersecting);
      },
      {
        root: scrollElement,
        rootMargin: `0px 0px ${latestStickThresholdRef.current}px 0px`,
        threshold: 0.0,
      }
    );

    observer.observe(markerElement);
    return () => observer.disconnect();
  }, [stickThreshold]);

  const useAnchor = forceStick || isMarkerVisible;

  // Initialize scroll position to bottom
  useEffect(() => {
    const element = scrollContainerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
      prevScrollHeightRef.current = element.scrollHeight;
      setIsMarkerVisible(true);
    }
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={className}
      style={{
        overflow: 'auto',
        scrollbarGutter: 'stable both-edges', // Prevents layout shift
        display: "flex",
        flexDirection: "column",
        width: "100%",
        overflowAnchor: 'auto', // Keep default anchoring enabled on the container itself
        ...style,
      }}
    >
      <div 
        className="tmp" 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          overflowAnchor: 'none', 
          flexGrow: 1, 
          flexShrink: 0 
        }}
      >
        {children}
      </div>

      <div
        ref={bottomMarkerRef}
        style={{
          minHeight: '1px',
          width: '100%',
          flexShrink: 0,
          overflowAnchor: useAnchor ? 'auto' : 'none',
        }}
        aria-hidden="true"
      ></div>
    </div>
  );
};

export default ScrollView;