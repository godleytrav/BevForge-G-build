import React from 'react';

// ============================================================
// BREWING EQUIPMENT SVG COMPONENTS
// Professional SVG representations of brewing vessels
// ============================================================

interface EquipmentSVGProps {
  width?: number;
  height?: number;
  fillLevel?: number; // 0-100%
  liquidColor?: string;
  status?: 'operational' | 'warning' | 'error' | 'offline';
  showLevel?: boolean;
  temperature?: number;
  className?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'operational':
      return 'hsl(var(--primary))';
    case 'warning':
      return '#f59e0b';
    case 'error':
      return '#ef4444';
    case 'offline':
      return '#6b7280';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

// ============================================================
// CONICAL FERMENTOR
// ============================================================
export const ConicalFermentor: React.FC<EquipmentSVGProps> = ({
  width = 120,
  height = 180,
  fillLevel = 0,
  liquidColor = '#f59e0b',
  status = 'operational',
  showLevel = true,
  temperature,
  className = '',
}) => {
  const statusColor = getStatusColor(status);
  const liquidHeight = (fillLevel / 100) * 120; // Max liquid height in cone + cylinder

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 180"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for vessel body */}
        <linearGradient id="vessel-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
          <stop offset="50%" stopColor="hsl(var(--background))" stopOpacity="0.1" />
          <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
        </linearGradient>
        {/* Liquid gradient */}
        <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={liquidColor} stopOpacity="0.6" />
          <stop offset="50%" stopColor={liquidColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={liquidColor} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Vessel body background */}
      <g>
        {/* Cylinder body */}
        <rect x="25" y="30" width="70" height="70" fill="url(#vessel-gradient)" />
        {/* Conical bottom */}
        <path d="M 25 100 L 60 150 L 95 100 Z" fill="url(#vessel-gradient)" />
      </g>

      {/* Outer vessel outline */}
      <g stroke={statusColor} strokeWidth="2.5" fill="none">
        {/* Top cylinder */}
        <ellipse cx="60" cy="30" rx="35" ry="8" fill="hsl(var(--background))" stroke={statusColor} strokeWidth="2" />
        <line x1="25" y1="30" x2="25" y2="100" />
        <line x1="95" y1="30" x2="95" y2="100" />
        
        {/* Conical bottom */}
        <path d="M 25 100 L 60 150 L 95 100" strokeWidth="2.5" />
        
        {/* Bottom valve */}
        <circle cx="60" cy="150" r="5" fill={statusColor} stroke="none" />
        <line x1="60" y1="155" x2="60" y2="165" strokeWidth="4" stroke={statusColor} />
        <rect x="54" y="165" width="12" height="10" rx="2" fill={statusColor} stroke="none" />
      </g>

      {/* Liquid fill */}
      {showLevel && fillLevel > 0 && (
        <g>
          <defs>
            <clipPath id="conical-clip">
              <rect x="25" y="30" width="70" height="70" />
              <path d="M 25 100 L 60 150 L 95 100 Z" />
            </clipPath>
          </defs>
          
          {/* Liquid in cylinder */}
          {liquidHeight > 0 && (
            <rect
              x="25"
              y={Math.max(30, 150 - liquidHeight)}
              width="70"
              height={Math.min(liquidHeight, 120)}
              fill="url(#liquid-gradient)"
              clipPath="url(#conical-clip)"
            />
          )}
          
          {/* Liquid surface ellipse */}
          {liquidHeight > 0 && liquidHeight < 120 && (
            <ellipse
              cx="60"
              cy={150 - liquidHeight}
              rx="35"
              ry="6"
              fill={liquidColor}
              opacity="0.9"
            />
          )}
        </g>
      )}

      {/* Temperature display */}
      {temperature !== undefined && (
        <g>
          <rect x="40" y="8" width="40" height="18" rx="4" fill="hsl(var(--background))" stroke={statusColor} strokeWidth="1.5" />
          <text
            x="60"
            y="20"
            textAnchor="middle"
            fontSize="11"
            fill="hsl(var(--foreground))"
            fontWeight="600"
          >
            {temperature}°F
          </text>
        </g>
      )}

      {/* Level percentage */}
      {showLevel && fillLevel > 0 && (
        <text
          x="105"
          y="90"
          textAnchor="start"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {fillLevel}%
        </text>
      )}
    </svg>
  );
};

// ============================================================
// BRIGHT TANK (Cylindrical with domed top)
// ============================================================
export const BrightTank: React.FC<EquipmentSVGProps> = ({
  width = 120,
  height = 180,
  fillLevel = 0,
  liquidColor = '#fbbf24',
  status = 'operational',
  showLevel = true,
  temperature,
  className = '',
}) => {
  const statusColor = getStatusColor(status);
  const liquidHeight = (fillLevel / 100) * 130;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 180"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer vessel outline */}
      <g stroke={statusColor} strokeWidth="2" fill="none">
        {/* Domed top */}
        <path d="M 25 50 Q 25 25, 60 25 Q 95 25, 95 50" fill="hsl(var(--background))" />
        
        {/* Cylinder body */}
        <line x1="25" y1="50" x2="25" y2="150" />
        <line x1="95" y1="50" x2="95" y2="150" />
        
        {/* Flat bottom */}
        <ellipse cx="60" cy="150" rx="35" ry="8" fill="hsl(var(--background))" />
        
        {/* Bottom valve */}
        <circle cx="60" cy="158" r="4" fill={statusColor} />
        <line x1="60" y1="162" x2="60" y2="173" strokeWidth="3" />
        <rect x="55" y="173" width="10" height="8" rx="2" fill={statusColor} />
      </g>

      {/* Liquid fill */}
      {showLevel && fillLevel > 0 && (
        <g opacity="0.7">
          <defs>
            <clipPath id="bright-clip">
              <rect x="25" y="50" width="70" height="100" />
              <ellipse cx="60" cy="150" rx="35" ry="8" />
            </clipPath>
          </defs>
          
          <rect
            x="25"
            y={Math.max(50, 150 - liquidHeight)}
            width="70"
            height={Math.min(liquidHeight, 100)}
            fill={liquidColor}
            clipPath="url(#bright-clip)"
          />
          
          {/* Liquid surface */}
          {liquidHeight < 130 && (
            <ellipse
              cx="60"
              cy={150 - liquidHeight}
              rx="35"
              ry="6"
              fill={liquidColor}
              opacity="0.9"
            />
          )}
        </g>
      )}

      {/* Pressure gauge on top */}
      <circle cx="60" cy="15" r="8" stroke={statusColor} strokeWidth="1.5" fill="hsl(var(--background))" />
      <line x1="60" y1="15" x2="64" y2="11" stroke={statusColor} strokeWidth="1.5" />

      {/* Temperature display */}
      {temperature !== undefined && (
        <text
          x="10"
          y="90"
          textAnchor="start"
          fontSize="12"
          fill={statusColor}
          fontWeight="600"
        >
          {temperature}°F
        </text>
      )}

      {/* Level percentage */}
      {showLevel && fillLevel > 0 && (
        <text
          x="105"
          y="100"
          textAnchor="start"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {fillLevel}%
        </text>
      )}
    </svg>
  );
};

// ============================================================
// HOT LIQUOR TANK (HLT)
// ============================================================
export const HotLiquorTank: React.FC<EquipmentSVGProps> = ({
  width = 120,
  height = 160,
  fillLevel = 0,
  liquidColor = '#3b82f6',
  status = 'operational',
  showLevel = true,
  temperature,
  className = '',
}) => {
  const statusColor = getStatusColor(status);
  const liquidHeight = (fillLevel / 100) * 100;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer vessel outline */}
      <g stroke={statusColor} strokeWidth="2" fill="none">
        {/* Top ellipse */}
        <ellipse cx="60" cy="30" rx="40" ry="10" fill="hsl(var(--background))" />
        
        {/* Cylinder sides */}
        <line x1="20" y1="30" x2="20" y2="130" />
        <line x1="100" y1="30" x2="100" y2="130" />
        
        {/* Bottom ellipse */}
        <ellipse cx="60" cy="130" rx="40" ry="10" fill="hsl(var(--background))" />
        
        {/* Heating element indicator */}
        <path
          d="M 40 140 Q 45 145, 50 140 Q 55 135, 60 140 Q 65 145, 70 140 Q 75 135, 80 140"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Outlet valve */}
        <circle cx="60" cy="138" r="4" fill={statusColor} />
        <line x1="60" y1="142" x2="60" y2="153" strokeWidth="3" />
        <rect x="55" y="153" width="10" height="8" rx="2" fill={statusColor} />
      </g>

      {/* Liquid fill */}
      {showLevel && fillLevel > 0 && (
        <g opacity="0.7">
          <defs>
            <clipPath id="hlt-clip">
              <rect x="20" y="30" width="80" height="100" />
              <ellipse cx="60" cy="130" rx="40" ry="10" />
            </clipPath>
          </defs>
          
          <rect
            x="20"
            y={Math.max(30, 130 - liquidHeight)}
            width="80"
            height={Math.min(liquidHeight, 100)}
            fill={liquidColor}
            clipPath="url(#hlt-clip)"
          />
          
          {/* Liquid surface */}
          {liquidHeight < 100 && (
            <ellipse
              cx="60"
              cy={130 - liquidHeight}
              rx="40"
              ry="8"
              fill={liquidColor}
              opacity="0.9"
            />
          )}
        </g>
      )}

      {/* Temperature display (prominent for HLT) */}
      {temperature !== undefined && (
        <g>
          <rect
            x="45"
            y="8"
            width="30"
            height="16"
            rx="3"
            fill="hsl(var(--background))"
            stroke={statusColor}
            strokeWidth="1"
          />
          <text
            x="60"
            y="19"
            textAnchor="middle"
            fontSize="11"
            fill={statusColor}
            fontWeight="700"
          >
            {temperature}°F
          </text>
        </g>
      )}

      {/* Level percentage */}
      {showLevel && fillLevel > 0 && (
        <text
          x="108"
          y="80"
          textAnchor="start"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {fillLevel}%
        </text>
      )}
    </svg>
  );
};

// ============================================================
// MASH TUN
// ============================================================
export const MashTun: React.FC<EquipmentSVGProps> = ({
  width = 120,
  height = 160,
  fillLevel = 0,
  liquidColor = '#92400e',
  status = 'operational',
  showLevel = true,
  temperature,
  className = '',
}) => {
  const statusColor = getStatusColor(status);
  const liquidHeight = (fillLevel / 100) * 90;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer vessel outline */}
      <g stroke={statusColor} strokeWidth="2" fill="none">
        {/* Lid */}
        <ellipse cx="60" cy="25" rx="42" ry="8" fill="hsl(var(--muted))" />
        <line x1="18" y1="25" x2="18" y2="30" />
        <line x1="102" y1="25" x2="102" y2="30" />
        
        {/* Top ellipse */}
        <ellipse cx="60" cy="35" rx="45" ry="10" fill="hsl(var(--background))" />
        
        {/* Cylinder sides */}
        <line x1="15" y1="35" x2="15" y2="125" />
        <line x1="105" y1="35" x2="105" y2="125" />
        
        {/* Bottom ellipse */}
        <ellipse cx="60" cy="125" rx="45" ry="10" fill="hsl(var(--background))" />
        
        {/* False bottom (grain bed support) */}
        <ellipse cx="60" cy="120" rx="38" ry="6" stroke={statusColor} strokeWidth="1" strokeDasharray="2,2" />
        
        {/* Outlet valve */}
        <circle cx="60" cy="133" r="4" fill={statusColor} />
        <line x1="60" y1="137" x2="60" y2="148" strokeWidth="3" />
        <rect x="55" y="148" width="10" height="8" rx="2" fill={statusColor} />
      </g>

      {/* Mash/grain fill */}
      {showLevel && fillLevel > 0 && (
        <g opacity="0.8">
          <defs>
            <clipPath id="mash-clip">
              <rect x="15" y="35" width="90" height="90" />
              <ellipse cx="60" cy="125" rx="45" ry="10" />
            </clipPath>
            {/* Grain texture pattern */}
            <pattern id="grain-pattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="rgba(0,0,0,0.1)" />
              <circle cx="3" cy="3" r="0.5" fill="rgba(0,0,0,0.1)" />
            </pattern>
          </defs>
          
          <rect
            x="15"
            y={Math.max(35, 125 - liquidHeight)}
            width="90"
            height={Math.min(liquidHeight, 90)}
            fill={liquidColor}
            clipPath="url(#mash-clip)"
          />
          
          {/* Grain texture overlay */}
          <rect
            x="15"
            y={Math.max(35, 125 - liquidHeight)}
            width="90"
            height={Math.min(liquidHeight, 90)}
            fill="url(#grain-pattern)"
            clipPath="url(#mash-clip)"
          />
          
          {/* Mash surface */}
          {liquidHeight < 90 && (
            <ellipse
              cx="60"
              cy={125 - liquidHeight}
              rx="45"
              ry="8"
              fill={liquidColor}
              opacity="0.9"
            />
          )}
        </g>
      )}

      {/* Temperature display */}
      {temperature !== undefined && (
        <text
          x="10"
          y="70"
          textAnchor="start"
          fontSize="12"
          fill={statusColor}
          fontWeight="600"
        >
          {temperature}°F
        </text>
      )}

      {/* Level percentage */}
      {showLevel && fillLevel > 0 && (
        <text
          x="110"
          y="80"
          textAnchor="start"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {fillLevel}%
        </text>
      )}
    </svg>
  );
};

// ============================================================
// BREW KETTLE (with sight glass)
// ============================================================
export const BrewKettle: React.FC<EquipmentSVGProps> = ({
  width = 120,
  height = 160,
  fillLevel = 0,
  liquidColor = '#92400e',
  status = 'operational',
  showLevel = true,
  temperature,
  className = '',
}) => {
  const statusColor = getStatusColor(status);
  const liquidHeight = (fillLevel / 100) * 95;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer vessel outline */}
      <g stroke={statusColor} strokeWidth="2" fill="none">
        {/* Top ellipse */}
        <ellipse cx="60" cy="30" rx="45" ry="10" fill="hsl(var(--background))" />
        
        {/* Cylinder sides */}
        <line x1="15" y1="30" x2="15" y2="125" />
        <line x1="105" y1="30" x2="105" y2="125" />
        
        {/* Bottom ellipse */}
        <ellipse cx="60" cy="125" rx="45" ry="10" fill="hsl(var(--background))" />
        
        {/* Heating element */}
        <path
          d="M 35 135 Q 40 140, 45 135 Q 50 130, 55 135 Q 60 140, 65 135 Q 70 130, 75 135 Q 80 140, 85 135"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Outlet valve */}
        <circle cx="60" cy="133" r="4" fill={statusColor} />
        <line x1="60" y1="137" x2="60" y2="148" strokeWidth="3" />
        <rect x="55" y="148" width="10" height="8" rx="2" fill={statusColor} />
      </g>

      {/* Sight glass on side */}
      <g stroke={statusColor} strokeWidth="1.5" fill="none">
        <rect x="108" y="50" width="8" height="70" rx="2" fill="hsl(var(--background))" opacity="0.3" />
        {showLevel && fillLevel > 0 && (
          <rect
            x="109"
            y={120 - (liquidHeight * 0.7)}
            width="6"
            height={liquidHeight * 0.7}
            fill={liquidColor}
            opacity="0.8"
          />
        )}
      </g>

      {/* Liquid fill */}
      {showLevel && fillLevel > 0 && (
        <g opacity="0.7">
          <defs>
            <clipPath id="kettle-clip">
              <rect x="15" y="30" width="90" height="95" />
              <ellipse cx="60" cy="125" rx="45" ry="10" />
            </clipPath>
          </defs>
          
          <rect
            x="15"
            y={Math.max(30, 125 - liquidHeight)}
            width="90"
            height={Math.min(liquidHeight, 95)}
            fill={liquidColor}
            clipPath="url(#kettle-clip)"
          />
          
          {/* Liquid surface */}
          {liquidHeight < 95 && (
            <ellipse
              cx="60"
              cy={125 - liquidHeight}
              rx="45"
              ry="8"
              fill={liquidColor}
              opacity="0.9"
            />
          )}
        </g>
      )}

      {/* Temperature display */}
      {temperature !== undefined && (
        <g>
          <rect
            x="45"
            y="8"
            width="30"
            height="16"
            rx="3"
            fill="hsl(var(--background))"
            stroke={statusColor}
            strokeWidth="1"
          />
          <text
            x="60"
            y="19"
            textAnchor="middle"
            fontSize="11"
            fill={statusColor}
            fontWeight="700"
          >
            {temperature}°F
          </text>
        </g>
      )}
    </svg>
  );
};

// ============================================================
// GENERIC VESSEL (fallback)
// ============================================================
export const GenericVessel: React.FC<EquipmentSVGProps> = ({
  width = 120,
  height = 160,
  fillLevel = 0,
  liquidColor = '#6b7280',
  status = 'operational',
  showLevel = true,
  temperature,
  className = '',
}) => {
  const statusColor = getStatusColor(status);
  const liquidHeight = (fillLevel / 100) * 100;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke={statusColor} strokeWidth="2" fill="none">
        <ellipse cx="60" cy="30" rx="40" ry="10" fill="hsl(var(--background))" />
        <line x1="20" y1="30" x2="20" y2="130" />
        <line x1="100" y1="30" x2="100" y2="130" />
        <ellipse cx="60" cy="130" rx="40" ry="10" fill="hsl(var(--background))" />
      </g>

      {showLevel && fillLevel > 0 && (
        <g opacity="0.7">
          <rect
            x="20"
            y={Math.max(30, 130 - liquidHeight)}
            width="80"
            height={Math.min(liquidHeight, 100)}
            fill={liquidColor}
          />
        </g>
      )}

      {temperature !== undefined && (
        <text x="60" y="20" textAnchor="middle" fontSize="12" fill={statusColor} fontWeight="600">
          {temperature}°F
        </text>
      )}
    </svg>
  );
};
