import type { Motif, Product, ProductKind, ProductView } from "@/lib/catalog";

const PINK = "#F991C3";

export function isLight(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function MotifArt({ motif, ink, text }: { motif: Motif; ink: string; text: string }) {
  switch (motif) {
    case "paw":
      return (
        <g fill={ink}>
          <ellipse cx="0" cy="8" rx="15" ry="12" />
          <circle cx="-17" cy="-8" r="6" />
          <circle cx="-6" cy="-18" r="6" />
          <circle cx="7" cy="-18" r="6" />
          <circle cx="18" cy="-8" r="6" />
        </g>
      );
    case "frenchie":
      return (
        <g>
          <path d="M-22 -6 L-26 -30 L-8 -18 Z M22 -6 L26 -30 L8 -18 Z" fill={ink} />
          <ellipse cx="0" cy="2" rx="22" ry="20" fill={ink} />
          <circle cx="-8" cy="-2" r="2.6" fill={PINK} />
          <circle cx="8" cy="-2" r="2.6" fill={PINK} />
          <ellipse cx="0" cy="9" rx="5" ry="3.4" fill={PINK} />
        </g>
      );
    case "cat":
      return (
        <g>
          <path d="M-22 -4 L-20 -30 L-4 -16 Z M22 -4 L20 -30 L4 -16 Z" fill={ink} />
          <ellipse cx="0" cy="4" rx="23" ry="19" fill={ink} />
          <path d="M-12 0 q4 -4 8 0 M4 0 q4 -4 8 0" stroke={PINK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M-3 9 L3 9 L0 13 Z" fill={PINK} />
        </g>
      );
    case "tree":
      return (
        <g fill={ink}>
          <path d="M0 -32 L14 -10 H6 L18 10 H-18 L-6 -10 H-14 Z" />
          <rect x="-3.5" y="10" width="7" height="9" />
          <circle cx="0" cy="-34" r="3.4" fill={PINK} />
          <circle cx="-7" cy="0" r="2.2" fill={PINK} />
          <circle cx="8" cy="4" r="2.2" fill={PINK} />
        </g>
      );
    case "tower":
      return (
        <g fill={ink}>
          {[16, -2, -20].map((y, i) => (
            <g key={y} transform={`translate(0 ${y}) scale(${1 - i * 0.12})`}>
              <path d="M-14 -8 L-16 -20 L-6 -12 Z M14 -8 L16 -20 L6 -12 Z" />
              <ellipse cx="0" cy="0" rx="15" ry="12" />
              <circle cx="-5" cy="-1" r="1.8" fill={PINK} />
              <circle cx="5" cy="-1" r="1.8" fill={PINK} />
            </g>
          ))}
        </g>
      );
    default:
      return (
        <text textAnchor="middle" y="4" fontSize={text.length > 8 ? 10 : 13} fontWeight="700" letterSpacing="2" fill={ink} fontFamily="Georgia, serif">
          {text}
        </text>
      );
  }
}

const outline = "rgba(20,38,22,0.22)";

function Tee({ color, view }: { color: string; view: ProductView }) {
  const collar = view === "back" ? "M70 18 Q100 28 130 18" : "M70 18 Q100 46 130 18";
  return (
    <>
      <path d="M70 18 L30 38 L8 80 L36 94 L50 76 L50 206 L150 206 L150 76 L164 94 L192 80 L170 38 L130 18 Q100 40 70 18 Z" fill={color} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M50 76 L50 206 L72 206 L72 40 Z" fill="rgba(0,0,0,0.05)" />
      <path d={collar} fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round" />
      <path d="M52 200 H148" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
    </>
  );
}

function Hoodie({ color, view }: { color: string; view: ProductView }) {
  return (
    <>
      <path d="M72 34 L28 56 L12 172 L40 178 L52 112 L52 226 L148 226 L148 112 L160 178 L188 172 L172 56 L128 34 Q100 56 72 34 Z" fill={color} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M52 112 L52 226 L74 226 L74 44 Z" fill="rgba(0,0,0,0.05)" />
      <path d="M66 36 Q58 0 100 4 Q142 0 134 36 Q100 62 66 36 Z" fill={color} stroke={outline} strokeWidth="1.5" />
      {view === "back" ? (
        <path d="M100 8 V44" stroke={outline} strokeWidth="1.2" />
      ) : (
        <>
          <path d="M80 34 Q100 18 120 34 Q100 52 80 34 Z" fill="rgba(0,0,0,0.18)" />
          <path d="M90 46 V76 M110 46 V76" stroke={outline} strokeWidth="2" strokeLinecap="round" />
          <path d="M72 176 L128 176 L138 210 L62 210 Z" fill="rgba(0,0,0,0.05)" stroke={outline} strokeWidth="1.2" />
        </>
      )}
      <path d="M48 220 H152" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
    </>
  );
}

function Mug({ color }: { color: string }) {
  return (
    <>
      <path d="M140 76 Q176 76 176 108 Q176 140 140 140" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
      <path d="M140 76 Q176 76 176 108 Q176 140 140 140" fill="none" stroke={outline} strokeWidth="1" />
      <rect x="44" y="48" width="100" height="112" rx="12" fill={color} stroke={outline} strokeWidth="1.5" />
      <rect x="44" y="48" width="22" height="112" rx="10" fill="rgba(0,0,0,0.06)" />
      <ellipse cx="94" cy="50" rx="50" ry="7" fill="rgba(0,0,0,0.12)" />
    </>
  );
}

function Cooler({ color }: { color: string }) {
  return (
    <>
      <path d="M102 8 L110 8 L104 40" stroke="#B9B2A0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M48 42 H152 L142 176 Q141 186 130 186 H70 Q59 186 58 176 Z" fill={color} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M48 42 H152 V54 H48 Z" fill="rgba(255,255,255,0.35)" stroke={outline} strokeWidth="1" />
      <path d="M48 42 L58 176 Q59 186 70 186 H80 L68 42 Z" fill="rgba(0,0,0,0.06)" />
    </>
  );
}

function Cap({ color, view }: { color: string; view: ProductView }) {
  return (
    <>
      <path d="M38 96 Q36 24 100 22 Q164 24 162 96 Z" fill={color} stroke={outline} strokeWidth="1.5" />
      <path d="M38 96 Q36 24 70 24 L70 96 Z" fill="rgba(0,0,0,0.06)" />
      {view === "back" ? (
        <rect x="76" y="82" width="48" height="10" rx="3" fill="rgba(0,0,0,0.18)" />
      ) : (
        <path d="M34 96 Q100 80 166 96 Q196 112 104 124 Q16 118 34 96 Z" fill={color} stroke={outline} strokeWidth="1.5" />
      )}
      <circle cx="100" cy="22" r="4" fill="rgba(0,0,0,0.25)" />
    </>
  );
}

const viewBoxes: Record<ProductKind, string> = {
  tee: "0 0 200 220",
  hoodie: "0 0 200 240",
  mug: "0 0 200 190",
  cooler: "0 0 200 200",
  cap: "0 0 200 140",
};

const printAt: Record<ProductKind, { x: number; y: number; s: number }> = {
  tee: { x: 100, y: 120, s: 1.35 },
  hoodie: { x: 100, y: 142, s: 1.1 },
  mug: { x: 94, y: 104, s: 1.2 },
  cooler: { x: 100, y: 112, s: 1.3 },
  cap: { x: 100, y: 62, s: 0.95 },
};

export const aspectOf: Record<ProductKind, string> = {
  tee: "200 / 220",
  hoodie: "200 / 240",
  mug: "200 / 190",
  cooler: "200 / 200",
  cap: "200 / 140",
};

export function Mockup({ kind, motif, printText, color, view }: { kind: ProductKind; motif: Motif; printText: string; color: string; view: ProductView }) {
  const ink = isLight(color) ? "#1E4D24" : "#F8F5EA";
  const at = printAt[kind];
  const back = view === "back";
  return (
    <svg viewBox={viewBoxes[kind]} className="h-full w-full drop-shadow-[0_14px_14px_rgba(20,38,22,0.14)]" role="img" aria-label={`${kind} ${view}`}>
      {kind === "tee" && <Tee color={color} view={view} />}
      {kind === "hoodie" && <Hoodie color={color} view={view} />}
      {kind === "mug" && <Mug color={color} />}
      {kind === "cooler" && <Cooler color={color} />}
      {kind === "cap" && <Cap color={color} view={view} />}
      {back ? (
        kind === "tee" || kind === "hoodie" ? (
          <g transform={`translate(100 ${kind === "tee" ? 70 : 84})`}>
            <text textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill={ink} fontFamily="Georgia, serif">
              SO GUAU
            </text>
            <text textAnchor="middle" y="14" fontSize="6" letterSpacing="2" fill={ink} opacity=".7" fontFamily="sans-serif">
              MODA QUE DEJA HUELLAS
            </text>
          </g>
        ) : kind === "cap" ? null : (
          <g transform={`translate(${at.x} ${at.y})`}>
            <text textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="3" fill={ink} fontFamily="Georgia, serif">
              SO GUAU
            </text>
          </g>
        )
      ) : (
        <g transform={`translate(${at.x} ${at.y}) scale(${at.s})`}>
          <MotifArt motif={motif} ink={ink} text={printText} />
        </g>
      )}
    </svg>
  );
}

export default function ProductArt({ product, color, view }: { product: Product; color: string; view: ProductView }) {
  const src = product.images[view] ?? (view === "profile" ? product.images.front : undefined);
  if (src) {
    return <div role="img" aria-label={product.name} className="h-full w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${src})` }} />;
  }
  return <Mockup kind={product.kind} motif={product.motif} printText={product.printText} color={color} view={view === "profile" ? "front" : view} />;
}
