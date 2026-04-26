import React from 'react';
import {
  ConicalFermentor,
  BrightTank,
  HotLiquorTank,
  MashTun,
  BrewKettle,
  GenericVessel,
} from './BrewingEquipmentSVGs';

// ============================================================
// EQUIPMENT RENDERER
// Renders devices as either SVG or tile based on displayMode
// ============================================================

interface EquipmentRendererProps {
  device: {
    id: number;
    name: string;
    tileType: string;
    positionX: string;
    positionY: string;
    width: string;
    height: string;
    status: 'operational' | 'warning' | 'error' | 'offline';
    config?: {
      displayMode?: 'svg' | 'tile';
      vesselType?: 'conical' | 'bright' | 'hlt' | 'mash' | 'kettle' | 'generic';
      capacity?: number;
      capacityUnit?: string;
      currentLevel?: number;
      currentTemp?: number;
    };
  };
  mode: 'edit' | 'control';
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  className?: string;
}

export const EquipmentRenderer: React.FC<EquipmentRendererProps> = ({
  device,
  mode,
  isSelected = false,
  isDragging = false,
  onClick,
  onMouseDown,
  onDoubleClick,
  className = '',
}) => {
  const displayMode = device.config?.displayMode || 'tile';
  const vesselType = device.config?.vesselType || 'generic';
  const fillLevel = device.config?.currentLevel || 0;
  const temperature = device.config?.currentTemp;

  // Determine liquid color based on vessel type
  const getLiquidColor = () => {
    switch (vesselType) {
      case 'hlt':
        return '#3b82f6'; // Blue for hot water
      case 'mash':
        return '#92400e'; // Brown for mash
      case 'kettle':
        return '#92400e'; // Brown for wort
      case 'conical':
        return '#f59e0b'; // Amber for fermenting beer
      case 'bright':
        return '#fbbf24'; // Golden for finished beer
      default:
        return '#6b7280'; // Gray for generic
    }
  };

  // Render SVG mode
  if (displayMode === 'svg' && device.tileType === 'vessel') {
    const SVGComponent = (() => {
      switch (vesselType) {
        case 'conical':
          return ConicalFermentor;
        case 'bright':
          return BrightTank;
        case 'hlt':
          return HotLiquorTank;
        case 'mash':
          return MashTun;
        case 'kettle':
          return BrewKettle;
        default:
          return GenericVessel;
      }
    })();

    return (
      <div
        className={`absolute cursor-pointer transition-all duration-200 ${
          isDragging ? 'scale-105 z-50' : 'z-10'
        } ${
          isSelected && mode === 'control'
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            : ''
        } ${
          mode === 'edit' ? 'hover:ring-2 hover:ring-muted' : ''
        } ${className}`}
        style={{
          left: `${device.positionX}px`,
          top: `${device.positionY}px`,
          width: `${device.width}px`,
          height: `${device.height}px`,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <SVGComponent
            width={parseInt(device.width)}
            height={parseInt(device.height)}
            fillLevel={fillLevel}
            liquidColor={getLiquidColor()}
            status={device.status}
            showLevel={true}
            temperature={temperature}
          />
          
          {/* Device name label */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-medium text-foreground bg-background/80 px-2 py-1 rounded">
              {device.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render tile mode (existing card-based UI)
  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 ${
        isDragging ? 'scale-105 z-50' : 'z-10'
      } ${
        isSelected && mode === 'control'
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
          : ''
      } ${
        mode === 'edit' ? 'hover:ring-2 hover:ring-muted' : ''
      } ${className}`}
      style={{
        left: `${device.positionX}px`,
        top: `${device.positionY}px`,
        width: `${device.width}px`,
        height: `${device.height}px`,
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <div className="w-full h-full bg-card border-2 border-border rounded-lg p-3 flex flex-col">
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-card-foreground truncate">
            {device.name}
          </span>
          <div
            className={`w-2 h-2 rounded-full ${
              device.status === 'operational'
                ? 'bg-green-500'
                : device.status === 'warning'
                ? 'bg-yellow-500'
                : device.status === 'error'
                ? 'bg-red-500'
                : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Device type badge */}
        <div className="text-xs text-muted-foreground mb-2">
          {device.tileType.replace('_', ' ').toUpperCase()}
        </div>

        {/* Device-specific content */}
        {device.tileType === 'vessel' && (
          <div className="flex-1 flex flex-col justify-center space-y-1 text-xs">
            {temperature !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temp:</span>
                <span className="font-medium">{temperature}°F</span>
              </div>
            )}
            {fillLevel > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level:</span>
                <span className="font-medium">{fillLevel}%</span>
              </div>
            )}
            {device.config?.capacity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-medium">
                  {device.config.capacity} {device.config.capacityUnit || 'gal'}
                </span>
              </div>
            )}
          </div>
        )}

        {device.tileType === 'pump' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">PUMP</div>
              <div className="text-xs text-muted-foreground mt-1">
                {device.status === 'operational' ? 'RUNNING' : 'OFF'}
              </div>
            </div>
          </div>
        )}

        {device.tileType === 'valve' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">VALVE</div>
              <div className="text-xs text-muted-foreground mt-1">
                {device.status === 'operational' ? 'OPEN' : 'CLOSED'}
              </div>
            </div>
          </div>
        )}

        {device.tileType === 'temp_sensor' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {temperature || '--'}°
              </div>
              <div className="text-xs text-muted-foreground mt-1">Temperature</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
