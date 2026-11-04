import type { BodyStyle } from "@/lib/data/types";

/**
 * Studio-style side-profile illustration used until real vehicle photography is supplied.
 * Pure SVG, tinted with the vehicle's paint colour.
 */

interface Shape {
  body: string;
  glass: string;
  pillars: number[];
  wheels: [number, number];
  r: number;
  door: number[];
  head: [number, number];
  tail: [number, number];
  bed?: string;
}

const shapes: Record<BodyStyle, Shape> = {
  sedan: {
    body: "M40,112 C40,98 46,90 60,86 L120,78 C140,60 165,48 200,46 L250,46 C275,48 295,62 312,78 L345,84 C356,87 362,96 362,108 L362,114 C362,118 358,120 354,120 L330,120 A30,30 0 0 0 272,120 L128,120 A30,30 0 0 0 70,120 L48,120 C43,120 40,117 40,112 Z",
    glass: "M134,80 C152,64 172,54 202,53 L248,53 C268,55 284,66 298,80 Z",
    pillars: [218], wheels: [99, 301], r: 26, door: [170, 236], head: [44, 92], tail: [352, 90],
  },
  hatchback: {
    body: "M48,112 C48,98 54,90 68,86 L118,78 C136,58 160,44 196,42 L282,42 C300,43 312,52 320,66 L330,86 C336,90 340,98 340,108 L340,114 C340,118 336,120 332,120 L321,120 A29,29 0 0 0 263,120 L133,120 A29,29 0 0 0 75,120 L56,120 C51,120 48,117 48,112 Z",
    glass: "M132,79 C148,62 168,50 198,49 L278,49 C292,50 302,58 308,70 L312,79 Z",
    pillars: [222], wheels: [104, 292], r: 25, door: [170, 250], head: [52, 92], tail: [332, 84],
  },
  mpv: {
    body: "M38,112 C38,96 44,88 58,84 L104,74 C120,50 140,34 180,32 L318,32 C340,32 352,44 358,62 L362,86 C366,92 366,100 366,108 L366,114 C366,118 362,120 358,120 L335,120 A29,29 0 0 0 277,120 L129,120 A29,29 0 0 0 71,120 L46,120 C41,120 38,117 38,112 Z",
    glass: "M118,76 C132,54 150,40 182,39 L314,39 C332,39 342,48 347,62 L350,76 Z",
    pillars: [200, 282], wheels: [100, 306], r: 25, door: [160, 240], head: [42, 90], tail: [358, 80],
  },
  suv: {
    body: "M38,110 C38,94 44,86 58,82 L108,72 C124,52 146,38 182,36 L300,36 C322,36 336,46 344,62 L354,82 C362,86 366,96 366,106 L366,112 C366,117 362,120 357,120 L333,120 A31,31 0 0 0 271,120 L133,120 A31,31 0 0 0 71,120 L46,120 C41,120 38,116 38,110 Z",
    glass: "M122,74 C136,56 154,44 184,43 L298,43 C314,43 325,51 332,64 L337,74 Z",
    pillars: [232], wheels: [102, 302], r: 27, door: [176, 262], head: [42, 88], tail: [358, 80],
  },
  pickup: {
    body: "M36,110 C36,94 42,86 56,82 L104,72 C120,50 140,38 172,36 L232,36 C240,36 246,42 248,50 L252,72 L370,72 L372,110 C372,116 368,120 362,120 L339,120 A31,31 0 0 0 277,120 L129,120 A31,31 0 0 0 67,120 L44,120 C39,120 36,116 36,110 Z",
    glass: "M118,74 C132,54 148,44 174,43 L232,43 C237,43 240,47 241,52 L244,74 Z",
    pillars: [182], wheels: [98, 308], r: 27, door: [150, 214], head: [40, 88], tail: [366, 80],
    bed: "M256,76 L366,76",
  },
};

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function CarIllustration({
  body, color, id, className = "", title,
}: { body: BodyStyle; color: string; id: string; className?: string; title?: string }) {
  const s = shapes[body];
  const light = parseInt(color.slice(1), 16) > 0xb0b0b0;
  const g = `car-${id}`;
  return (
    <svg viewBox="0 0 400 150" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${g}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(color, 0.16)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -0.2)} />
        </linearGradient>
        <linearGradient id={`${g}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4550" />
          <stop offset="0.55" stopColor="#1a2027" />
          <stop offset="1" stopColor="#2b333c" />
        </linearGradient>
        <radialGradient id={`${g}-rim`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#e9ecef" />
          <stop offset="1" stopColor="#8d949c" />
        </radialGradient>
        <clipPath id={`${g}-clip`}>
          <path d={s.glass} />
        </clipPath>
      </defs>
      <ellipse cx="200" cy="124" rx="176" ry="9" fill="#111418" opacity="0.16" />
      <path d={s.body} fill={`url(#${g}-paint)`} stroke={light ? "#00000022" : "#00000040"} strokeWidth="1" />
      {/* shoulder highlight */}
      <path d={s.body} fill="none" stroke="#ffffff" strokeOpacity={light ? 0.5 : 0.18} strokeWidth="1.2" transform="translate(0,-1)" />
      <path d={s.glass} fill={`url(#${g}-glass)`} />
      <path d={s.glass} fill="#ffffff" opacity="0.07" transform="translate(6,0) scale(0.97,1)" />
      <g clipPath={`url(#${g}-clip)`}>
        {s.pillars.map((x) => (
          <rect key={x} x={x - 3} y="20" width="6" height="70" fill={shade(color, -0.12)} />
        ))}
      </g>
      <path d={s.glass} fill="none" stroke={shade(color, -0.12)} strokeWidth="2" />
      {s.door.map((x) => (
        <line key={x} x1={x} y1="84" x2={x} y2="116" stroke="#000" strokeOpacity="0.18" strokeWidth="1" />
      ))}
      <line x1={s.door[0] + 18} y1="92" x2={s.door[0] + 30} y2="92" stroke="#000" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
      {s.bed && <path d={s.bed} stroke="#000" strokeOpacity="0.3" strokeWidth="2" />}
      <rect x={s.head[0]} y={s.head[1]} width="16" height="6" rx="3" fill="#f4efe2" />
      <rect x={s.tail[0] - 8} y={s.tail[1]} width="10" height="7" rx="2.5" fill="#b3261e" />
      {s.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="120" r={s.r} fill="#16191d" />
          <circle cx={cx} cy="120" r={s.r * 0.6} fill={`url(#${g}-rim)`} />
          {[0, 72, 144, 216, 288].map((a) => (
            <line key={a} x1={cx} y1="120" x2={cx + Math.cos((a * Math.PI) / 180) * s.r * 0.55} y2={120 + Math.sin((a * Math.PI) / 180) * s.r * 0.55}
              stroke="#5d646c" strokeWidth="3" strokeLinecap="round" />
          ))}
          <circle cx={cx} cy="120" r={s.r * 0.16} fill="#3b4148" />
        </g>
      ))}
    </svg>
  );
}
