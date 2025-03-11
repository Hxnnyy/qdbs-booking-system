
import React from 'react';
import { DragPreview } from '@/types/calendar';

interface DragPreviewOverlayProps {
  dragPreview: DragPreview | null;
}

export const DragPreviewOverlay: React.FC<DragPreviewOverlayProps> = ({ dragPreview }) => {
  if (!dragPreview || dragPreview.columnIndex === undefined) return null;
  
  return (
    <div 
      className="absolute left-0 top-0 pointer-events-none z-50 w-full h-full"
      style={{
        gridColumnStart: dragPreview.columnIndex + 1,
        gridColumnEnd: dragPreview.columnIndex + 2,
      }}
    >
      <div 
        className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md absolute"
        style={{
          top: `${dragPreview.top}px`,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        Drop to schedule at {dragPreview.time}
      </div>
    </div>
  );
};
