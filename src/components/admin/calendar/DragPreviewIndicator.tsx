
import React from 'react';
import { DragPreview } from '@/types/calendar';

interface DragPreviewIndicatorProps {
  dragPreview: DragPreview | null;
  isWeekView?: boolean;
}

export const DragPreviewIndicator: React.FC<DragPreviewIndicatorProps> = ({ 
  dragPreview, 
  isWeekView = false 
}) => {
  if (!dragPreview) return null;

  // Enhanced pulse animation with more visibility
  const pulseStyle = {
    animation: 'pulse 1.5s infinite',
    boxShadow: '0 0 10px rgba(var(--primary), 0.6)',
    transition: 'all 0.1s ease-out',
    zIndex: 1000,
  };

  if (isWeekView && dragPreview.columnIndex !== undefined) {
    return (
      <div 
        className="absolute left-0 top-0 pointer-events-none z-50 w-full h-full"
        style={{
          gridColumnStart: dragPreview.columnIndex + 2,
          gridColumnEnd: dragPreview.columnIndex + 3,
        }}
      >
        <div 
          className="bg-primary/90 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-lg absolute"
          style={{
            top: `${dragPreview.top}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            ...pulseStyle
          }}
        >
          Drop to schedule at {dragPreview.time}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute pointer-events-none z-50 grid grid-cols-[4rem_1fr]"
      style={{ top: `${dragPreview.top}px` }}
    >
      <div></div>
      <div 
        className="bg-primary/90 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-lg"
        style={pulseStyle}
      >
        Drop to schedule at {dragPreview.time}
      </div>
    </div>
  );
};
