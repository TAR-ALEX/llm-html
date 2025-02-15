import { CSSProperties, ReactNode } from 'react';

type Alignment = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
type Direction = 'row' | 'column';

interface LayoutProps {
  children: ReactNode;
  gap?: number;
  align?: Alignment;
  justify?: Alignment;
  wrap?: boolean;
  style?: CSSProperties;
  className?: string;
}

const baseStyles: CSSProperties = {
  display: 'flex',
  boxSizing: 'border-box',
};

const createLayout = (direction: Direction) => ({
  children,
  gap = 0,
  align = 'start',
  justify = 'start',
  wrap = false,
  style = {},
  className,
}: LayoutProps) => {
  const layoutStyle: CSSProperties = {
    ...baseStyles,
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: `${gap}px`,
    ...style,
  };

  return (
    <div style={layoutStyle} className={className}>
      {children}
    </div>
  );
};

export const Row = createLayout('row');
export const Column = createLayout('column');