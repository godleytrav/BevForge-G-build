import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DragItem, DropZone as DropZoneType } from '@/lib/canvas-dnd';
import { canDrop as checkCanDrop, getDropZoneClass } from '@/lib/canvas-dnd';

interface DropZoneProps {
  zone: DropZoneType;
  children: React.ReactNode;
  className?: string;
  onDrop?: (item: DragItem, zone: DropZoneType) => void;
  isDragging?: boolean;
}

export function DropZone({
  zone,
  children,
  className,
  onDrop,
  isDragging = false,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const item = JSON.parse(data) as DragItem;
        setDragItem(item);
        
        if (checkCanDrop(item, zone)) {
          e.dataTransfer.dropEffect = 'move';
        } else {
          e.dataTransfer.dropEffect = 'none';
        }
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set isOver to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsOver(false);
      setDragItem(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsOver(false);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const item = JSON.parse(data) as DragItem;
        
        if (checkCanDrop(item, zone)) {
          onDrop?.(item, zone);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDragItem(null);
    }
  };

  const canDropItem = dragItem ? checkCanDrop(dragItem, zone) : false;
  const dropZoneClass = getDropZoneClass(isOver, canDropItem, isDragging);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'transition-all duration-200',
        dropZoneClass,
        className
      )}
    >
      {children}
      
      {/* Drop Indicator */}
      {isOver && canDropItem && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium">
            Drop here
          </div>
        </div>
      )}
      
      {isOver && !canDropItem && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-destructive/5 border-2 border-dashed border-destructive rounded-lg">
          <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm font-medium">
            Cannot drop here
          </div>
        </div>
      )}
    </div>
  );
}
