import { useId } from 'react';
import { formatVolumeNumber } from '@/lib/volume-format';
import { cn } from '@/lib/utils';

type AssetVariant = 'source' | 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'keg' | 'can' | 'bottle';

interface ProcessAssetTileProps {
  label: string;
  subtitle?: string;
  variant: AssetVariant;
  visualStyle?: string;
  currentQty: number;
  capacityQty?: number;
  unit: string;
  valueLabel?: string;
  capacityLabel?: string;
  accentClassName?: string;
  onClick?: () => void;
}

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const liquidHeight = (fillPercent: number, maxHeight: number): number => (maxHeight * fillPercent) / 100;

const fillY = (baseY: number, fillPercent: number, maxHeight: number): number =>
  baseY - liquidHeight(fillPercent, maxHeight);

const DeviceBadge = ({ text }: { text: string }) => (
  <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
    {text}
  </div>
);

const VesselSvg = ({
  fillPercent,
  accentClassName,
  clipId,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
}) => (
  <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
    <defs>
      <clipPath id={clipId}>
        <path d="M28 18h64c4 0 8 4 8 8v72c0 4-2 8-4 10l-10 24H34l-10-24c-2-2-4-6-4-10V26c0-4 4-8 8-8z" />
      </clipPath>
    </defs>
    <ellipse cx="60" cy="20" rx="24" ry="6" className="fill-white/10" />
    <path
      d="M28 18h64c4 0 8 4 8 8v72c0 4-2 8-4 10l-10 24H34l-10-24c-2-2-4-6-4-10V26c0-4 4-8 8-8z"
      className="fill-slate-950/40 stroke-white/45"
      strokeWidth="3"
    />
    <rect
      x="16"
      y={fillY(132, fillPercent, 110)}
      width="88"
      height={liquidHeight(fillPercent, 110)}
      clipPath={`url(#${clipId})`}
      className={cn('fill-cyan-400/70', accentClassName)}
    />
    <path d="M36 30h48M26 108h68" className="stroke-white/18" strokeWidth="4" />
    <path d="M42 132v14M78 132v14" className="stroke-white/30" strokeWidth="4" strokeLinecap="round" />
    <rect x="88" y="38" width="6" height="54" rx="3" className="fill-black/30 stroke-white/18" />
    <rect x="89" y={fillY(92, fillPercent, 54)} width="4" height={liquidHeight(fillPercent, 54)} rx="2" className={cn('fill-cyan-300/75', accentClassName)} />
    <path d="M32 24c14 6 42 6 56 0" className="stroke-white/18" strokeWidth="2" fill="none" />
    <path d="M40 26v82" className="stroke-white/8" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

const BrightTankSvg = ({
  fillPercent,
  accentClassName,
  clipId,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
}) => (
  <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
    <defs>
      <clipPath id={clipId}>
        <path d="M32 22h56c10 0 18 8 18 18v42c0 8-5 15-12 17l-7 21H33l-7-21c-7-2-12-9-12-17V40c0-10 8-18 18-18z" />
      </clipPath>
    </defs>
    <path
      d="M32 22h56c10 0 18 8 18 18v42c0 8-5 15-12 17l-7 21H33l-7-21c-7-2-12-9-12-17V40c0-10 8-18 18-18z"
      className="fill-slate-950/38 stroke-white/45"
      strokeWidth="3"
    />
    <rect
      x="12"
      y={fillY(120, fillPercent, 86)}
      width="96"
      height={liquidHeight(fillPercent, 86)}
      clipPath={`url(#${clipId})`}
      className={cn('fill-emerald-400/70', accentClassName)}
    />
    <ellipse cx="60" cy="32" rx="34" ry="10" className="fill-white/8 stroke-white/12" />
    <path d="M24 72h72M30 88h60" className="stroke-white/16" strokeWidth="3" />
    <path d="M40 120v20M80 120v20" className="stroke-white/28" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 14v12" className="stroke-white/35" strokeWidth="4" strokeLinecap="round" />
    <circle cx="60" cy="12" r="4" className="fill-white/16 stroke-white/24" />
  </svg>
);

const BarrelSvg = ({
  fillPercent,
  accentClassName,
  clipId,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
}) => (
  <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
    <defs>
      <clipPath id={clipId}>
        <path d="M34 24c10-8 42-8 52 0 6 12 10 28 10 48s-4 36-10 48c-10 8-42 8-52 0-6-12-10-28-10-48s4-36 10-48z" />
      </clipPath>
    </defs>
    <path
      d="M34 24c10-8 42-8 52 0 6 12 10 28 10 48s-4 36-10 48c-10 8-42 8-52 0-6-12-10-28-10-48s4-36 10-48z"
      className="fill-amber-950/35 stroke-white/45"
      strokeWidth="3"
    />
    <rect
      x="22"
      y={fillY(122, fillPercent, 94)}
      width="76"
      height={liquidHeight(fillPercent, 94)}
      clipPath={`url(#${clipId})`}
      className={cn('fill-amber-400/65', accentClassName)}
    />
    <path d="M32 42h56M28 62h64M26 82h68M28 102h64M32 122h56" className="stroke-white/28" strokeWidth="4" />
    <path d="M42 26c8 6 28 6 36 0M42 138c8-6 28-6 36 0" className="stroke-white/16" strokeWidth="2" fill="none" />
  </svg>
);

const KegSvg = ({
  fillPercent,
  accentClassName,
  clipId,
  visualStyle,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
  visualStyle?: string;
}) => (
  <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
    <defs>
      <clipPath id={clipId}>
        <path d="M31 36c0-7 5-13 12-14l5-3h24l5 3c7 1 12 7 12 14v78c0 11-5 20-12 25-6 4-28 4-34 0-7-5-12-14-12-25V36z" />
      </clipPath>
    </defs>

    <ellipse cx="60" cy="22" rx="28" ry="8" className="fill-white/6 stroke-white/85" strokeWidth="2.5" />
    <ellipse cx="60" cy="22" rx="21" ry="5.5" className="fill-slate-950/80 stroke-white/80" strokeWidth="2" />
    <rect x="53" y="14" width="14" height="10" rx="2.5" className="fill-slate-950/90 stroke-white/75" strokeWidth="2" />
    {visualStyle === 'ball-lock' ? (
      <>
        <circle cx="76" cy="20" r="4.5" className="fill-slate-950/90 stroke-white/75" strokeWidth="2" />
        <circle cx="44" cy="20" r="3.5" className="fill-white/10 stroke-transparent" />
      </>
    ) : visualStyle === 'pin-lock' ? (
      <>
        <rect x="72" y="17" width="10" height="6" rx="3" className="fill-slate-950/90 stroke-white/75" strokeWidth="2" />
        <rect x="38" y="17" width="8" height="5" rx="2.5" className="fill-white/10 stroke-transparent" />
      </>
    ) : (
      <>
        <circle cx="76" cy="20" r="4.5" className="fill-slate-950/90 stroke-white/75" strokeWidth="2" />
        <circle cx="44" cy="20" r="3.5" className="fill-white/10 stroke-transparent" />
      </>
    )}

    <rect
      x="24"
      y={fillY(139, fillPercent, 114)}
      width="72"
      height={liquidHeight(fillPercent, 114)}
      clipPath={`url(#${clipId})`}
      className={cn('fill-emerald-400/72', accentClassName)}
    />

    <path
      d="M31 36c0-7 5-13 12-14l5-3h24l5 3c7 1 12 7 12 14v78c0 11-5 20-12 25-6 4-28 4-34 0-7-5-12-14-12-25V36z"
      className="fill-white/5 stroke-white/88"
      strokeWidth="2.75"
    />
    <path d="M40 40c-6 2-9 7-9 14v57c0 9 4 16 10 20" className="stroke-white/18" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M34 54c8 4 44 4 52 0M31 71c10 4 48 4 58 0M31 92c10 4 48 4 58 0M34 114c8 4 44 4 52 0" className="stroke-white/80" strokeWidth="2.6" fill="none" />
    <path d="M42 30c1 4 3 7 7 9M78 29c-1 4-3 7-7 9" className="stroke-white/55" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    <path d="M38 128c5 4 39 4 44 0" className="stroke-white/82" strokeWidth="2.3" fill="none" />
    <path d="M47 44c-5 0-10-2-13-6-2-4-1-7 3-7h5c4 0 7 2 8 5s0 6-3 8z" className="fill-transparent stroke-white/78" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M70 44c5 0 10-2 13-6 2-4 1-7-3-7h-5c-4 0-7 2-8 5s0 6 3 8z" className="fill-transparent stroke-white/78" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M47 42h5M68 42h5" className="stroke-white/58" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M36 135c8 5 40 5 48 0" className="stroke-white/60" strokeWidth="2.1" fill="none" />
  </svg>
);

const CanSvg = ({
  fillPercent,
  accentClassName,
  clipId,
  visualStyle,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
  visualStyle?: string;
}) => {
  const isSlim = visualStyle === 'slim';
  const isSleek = visualStyle === 'sleek';
  const x = isSlim ? 39 : isSleek ? 35 : 31;
  const width = isSlim ? 42 : isSleek ? 50 : 58;
  const y = isSlim ? 12 : 16;
  const height = isSlim ? 132 : isSleek ? 126 : 122;
  const topCurve = isSlim ? 6 : 8;
  const bodyPath = `M${x + 8} ${y + 6}
    C${x + 8} ${y + 2}, ${x + width - 8} ${y + 2}, ${x + width - 8} ${y + 6}
    C${x + width - 4} ${y + 11}, ${x + width - 1} ${y + 18}, ${x + width - 1} ${y + 26}
    V${y + height - 18}
    C${x + width - 1} ${y + height - 8}, ${x + width - 5} ${y + height - 2}, ${x + width - 10} ${y + height}
    H${x + 10}
    C${x + 5} ${y + height - 2}, ${x + 1} ${y + height - 8}, ${x + 1} ${y + height - 18}
    V${y + 26}
    C${x + 1} ${y + 18}, ${x + 4} ${y + 11}, ${x + 8} ${y + 6}z`;
  return (
    <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={bodyPath} />
        </clipPath>
      </defs>

      <ellipse cx="60" cy={y + topCurve} rx={width / 2 - 2} ry="8.5" className="fill-white/8 stroke-white/88" strokeWidth="2.2" />
      <ellipse cx="60" cy={y + topCurve + 1} rx={width / 2 - 10} ry="4.5" className="fill-slate-950/78 stroke-white/75" strokeWidth="1.8" />
      <path d={bodyPath} className="fill-white/5 stroke-white/88" strokeWidth="2.6" strokeLinejoin="round" />

      <rect
        x={x - 4}
        y={fillY(y + height + 1, fillPercent, height + 2)}
        width={width + 8}
        height={liquidHeight(fillPercent, height + 2)}
        clipPath={`url(#${clipId})`}
        className={cn('fill-sky-400/72', accentClassName)}
      />

      <path d={`M${x + 5} ${y + 24}V${y + height - 22}`} className="stroke-white/20" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x + width - 6} ${y + 22}V${y + height - 22}`} className="stroke-black/30" strokeWidth="6" strokeLinecap="round" />
      <path d={`M${x + 9} ${y + 18}H${x + width - 9}`} className="stroke-white/70" strokeWidth="2.1" strokeLinecap="round" />
      <path d={`M${x + 10} ${y + height - 6}H${x + width - 10}`} className="stroke-white/75" strokeWidth="2.1" strokeLinecap="round" />
      <path d={`M${x + 15} ${y + 36}V${y + height - 32}`} className="stroke-white/72" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M${x + width - 16} ${y + 28}V${y + height - 24}`} className="stroke-black/35" strokeWidth="3.2" strokeLinecap="round" />
      <path d={`M54 ${y + 3}c4-2 12-2 16 0 2 1 3 3 2 5-2 2-5 2-7 1-2 0-3 1-4 3-1 2-4 2-5 0-1-2-2-3-4-3-2 1-5 1-7-1-1-2 0-4 2-5 2-1 4-1 7 0z`} className="fill-transparent stroke-white/78" strokeWidth="1.8" strokeLinejoin="round" />
      <path d={`M60 ${y + 4}v6`} className="stroke-white/68" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

const BottleSvg = ({
  fillPercent,
  accentClassName,
  clipId,
  visualStyle,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
  visualStyle?: string;
}) => {
  const bottlePath =
    visualStyle === 'wine'
      ? 'M49 12h22v18c0 6 3 13 8 19l8 14v55c0 15-11 27-27 27S33 133 33 118V63l8-14c5-6 8-13 8-19V12z'
      : visualStyle === 'longneck'
        ? 'M52 10h16v34c0 4 2 8 6 13l6 10v56c0 12-9 22-20 22s-20-10-20-22V67l6-10c4-5 6-9 6-13V10z'
        : visualStyle === 'stubby'
          ? 'M48 19h24v16c0 4 2 8 6 12l5 8v63c0 16-10 27-23 27s-23-11-23-27V55l5-8c4-4 6-8 6-12V19z'
          : visualStyle === 'bomber'
            ? 'M49 12h22v24c0 5 3 11 7 16l7 12v57c0 13-10 24-25 24s-25-11-25-24V64l7-12c4-5 7-11 7-16V12z'
            : 'M50 14h20v26c0 5 3 10 7 15l6 10v57c0 13-9 23-23 23s-23-10-23-23V65l6-10c4-5 7-10 7-15V14z';
  const shoulderY = visualStyle === 'wine' ? 54 : visualStyle === 'longneck' ? 58 : 60;
  return (
    <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={bottlePath} />
        </clipPath>
      </defs>
      <path d={bottlePath} className="fill-white/5 stroke-white/88" strokeWidth="2.6" strokeLinejoin="round" />
      <rect
        x="30"
        y={fillY(145, fillPercent, 118)}
        width="60"
        height={liquidHeight(fillPercent, 118)}
        clipPath={`url(#${clipId})`}
        className={cn('fill-rose-400/70', accentClassName)}
      />
      <path d="M56 10h8" className="stroke-white/84" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M47 24c0 10 3 18 8 23" className="stroke-white/68" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M38 72c0 30 0 44 2 56" className="stroke-white/20" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <path d="M46 22c-2 9-3 19-1 28 2 10 4 13 7 17" className="stroke-white/88" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d={`M42 ${shoulderY}c5 6 31 6 36 0`} className="stroke-white/16" strokeWidth="2.4" fill="none" />
      <path d="M46 136c5 2 23 2 28 0" className="stroke-white/72" strokeWidth="2" fill="none" />
      <path d="M73 30c2 8 3 16 2 25-1 6-2 10-4 13" className="stroke-black/25" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M52 142c3 2 13 2 16 0" className="stroke-white/42" strokeWidth="1.8" fill="none" />
    </svg>
  );
};

const PackageLineSvg = ({
  fillPercent,
  accentClassName,
  clipId,
}: {
  fillPercent: number;
  accentClassName: string;
  clipId: string;
}) => (
  <svg viewBox="0 0 120 160" className="h-40 w-full" aria-hidden="true">
    <defs>
      <clipPath id={clipId}>
        <rect x="32" y="78" width="56" height="48" rx="12" />
      </clipPath>
    </defs>
    <rect x="22" y="34" width="76" height="18" rx="9" className="fill-slate-950/35 stroke-white/28" strokeWidth="3" />
    <path d="M34 52v26M50 52v26M70 52v26M86 52v26" className="stroke-white/24" strokeWidth="4" strokeLinecap="round" />
    <rect x="32" y="78" width="56" height="48" rx="12" className="fill-slate-950/40 stroke-white/45" strokeWidth="3" />
    <rect
      x="28"
      y={fillY(126, fillPercent, 48)}
      width="64"
      height={liquidHeight(fillPercent, 48)}
      clipPath={`url(#${clipId})`}
      className={cn('fill-sky-400/70', accentClassName)}
    />
    <path d="M24 126h72" className="stroke-white/18" strokeWidth="5" strokeLinecap="round" />
    <circle cx="42" cy="138" r="6" className="fill-white/12 stroke-white/18" />
    <circle cx="78" cy="138" r="6" className="fill-white/12 stroke-white/18" />
  </svg>
);

export default function ProcessAssetTile({
  label,
  subtitle,
  variant,
  visualStyle,
  currentQty,
  capacityQty,
  unit,
  valueLabel,
  capacityLabel,
  accentClassName = '',
  onClick,
}: ProcessAssetTileProps) {
  const clipId = useId().replace(/:/g, '');
  const fillPercent = clampPercent(
    capacityQty && capacityQty > 0 ? (currentQty / capacityQty) * 100 : currentQty > 0 ? 100 : 0
  );

  const visual =
    variant === 'barrel' ? (
      <BarrelSvg fillPercent={fillPercent} accentClassName={accentClassName} clipId={clipId} />
    ) : variant === 'bright_tank' ? (
      <BrightTankSvg fillPercent={fillPercent} accentClassName={accentClassName} clipId={clipId} />
    ) : variant === 'keg' ? (
      <KegSvg
        fillPercent={fillPercent}
        accentClassName={accentClassName}
        clipId={clipId}
        visualStyle={visualStyle}
      />
    ) : variant === 'can' ? (
      <CanSvg
        fillPercent={fillPercent}
        accentClassName={accentClassName}
        clipId={clipId}
        visualStyle={visualStyle}
      />
    ) : variant === 'bottle' ? (
      <BottleSvg
        fillPercent={fillPercent}
        accentClassName={accentClassName}
        clipId={clipId}
        visualStyle={visualStyle}
      />
    ) : variant === 'package_line' ? (
      <PackageLineSvg fillPercent={fillPercent} accentClassName={accentClassName} clipId={clipId} />
    ) : (
      <VesselSvg fillPercent={fillPercent} accentClassName={accentClassName} clipId={clipId} />
    );

  const deviceTypeLabel =
    variant === 'source'
      ? 'source vessel'
      : variant === 'bright_tank'
        ? 'bright tank'
        : variant === 'barrel'
          ? 'barrel'
          : variant === 'keg'
            ? 'keg'
            : variant === 'can'
              ? 'can'
              : variant === 'bottle'
                ? 'bottle'
                : variant === 'package_line'
                  ? 'package line'
                  : 'vessel';

  const content = (
    <>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {subtitle ? <p className="text-xs text-white/60">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <DeviceBadge text={deviceTypeLabel} />
          <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/65">
            {fillPercent.toFixed(0)}%
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">{visual}</div>
      <div className="mt-2 space-y-1">
        <p className="text-lg font-semibold text-white">
          {valueLabel ?? `${formatVolumeNumber(currentQty)} ${unit}`}
        </p>
        <p className="text-xs text-white/60">
          {capacityLabel ??
            (capacityQty && capacityQty > 0
              ? `Capacity ${formatVolumeNumber(capacityQty)} ${unit}`
              : 'Capacity not set')}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(16,24,40,0.94)_0%,rgba(7,12,22,0.98)_100%)] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-sm transition hover:border-cyan-400/25 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_52px_rgba(0,0,0,0.4)]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(16,24,40,0.94)_0%,rgba(7,12,22,0.98)_100%)] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-sm">
      {content}
    </div>
  );
}
