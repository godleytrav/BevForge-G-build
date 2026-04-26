import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DragItem } from '@/lib/canvas-dnd';

interface DraggableItemProps {
  item: DragItem;
  children: React.ReactNode;
  className?: string;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: () => void;
}

export function DraggableItem({
  item,
  children,
  className,
  onDragStart,
  onDragEnd,
}: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    onDragStart?.(item);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'group relative cursor-move transition-all',
        isDragging && 'opacity-50 scale-95',
        className
      )}
    >
      {/* Drag Handle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {children}
    </div>
  );
}
