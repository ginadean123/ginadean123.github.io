import React, { useMemo, useRef } from "react";

// ---------- Types ----------
interface Dog {
  Name: string;
  Sire: string;
  Dam: string;
  Sex?: string;
  Breed?: string;
  Color?: string;
  Breeder?: string;
  Owner?: string;
  Titles?: string;
  "Date of Birth"?: string;
  [key: string]: any;
}

interface PedigreeTableProps {
  rootDog: Dog;
  dogs: Dog[];
  generations?: number; // columns; default 5
}

// ---------- Lookup helpers ----------
function norm(s?: string) {
  return (s || "").trim().toLowerCase();
}
function findDog(name: string | undefined, dogs: Dog[]) {
  if (!name) return undefined;
  const key = norm(name);
  return dogs.find((d) => norm(d.Name) === key);
}

// ---------- Lightweight stats (name-only pedigree approximations) ----------
function getAncestorsSet(dog: Dog | undefined, dogs: Dog[], depth: number): Set<string> {
  const out = new Set<string>();
  if (!dog || depth <= 0) return out;
  const queue: { d?: Dog; lvl: number }[] = [{ d: dog, lvl: 0 }];
  while (queue.length) {
    const { d, lvl } = queue.shift()!;
    if (!d || lvl >= depth) continue;
    const sire = findDog(d.Sire, dogs);
    const dam  = findDog(d.Dam,  dogs);
    if (sire?.Name) out.add(sire.Name);
    if (dam?.Name) out.add(dam.Name);
    queue.push({ d: sire, lvl: lvl + 1 });
    queue.push({ d: dam,  lvl: lvl + 1 });
  }
  return out;
}

// % 0–25-ish based on overlap ratio (readable band for name-only data)
function approxCOIofDog(dog: Dog | undefined, dogs: Dog[], depth = 5): number {
  if (!dog) return 0;
  const sire = findDog(dog.Sire, dogs);
  const dam  = findDog(dog.Dam,  dogs);
  if (!sire || !dam) return 0;
  const A = getAncestorsSet(sire, dogs, depth);
  const B = getAncestorsSet(dam,  dogs, depth);
  const shared = [...A].filter((x) => B.has(x)).length;
  const denom  = Math.max(A.size, B.size, 1);
  return (shared / denom) * 25;
}

// ALC (0–1): unique / possible
function approxALCofDog(dog: Dog | undefined, dogs: Dog[], depth = 5): number {
  if (!dog) return 0;
  const unique = getAncestorsSet(dog, dogs, depth).size;
  const possible = Math.pow(2, depth) - 2;
  if (possible <= 0) return 0;
  return Math.min(1, unique / possible);
}

// COR (0–1): Jaccard similarity of parents' ancestors
function approxCORofParents(dog: Dog | undefined, dogs: Dog[], depth = 5): number {
  if (!dog) return 0;
  const sire = findDog(dog.Sire, dogs);
  const dam  = findDog(dog.Dam,  dogs);
  if (!sire || !dam) return 0;
  const A = getAncestorsSet(sire, dogs, depth);
  const B = getAncestorsSet(dam,  dogs, depth);
  const shared = [...A].filter((x) => B.has(x)).length;
  const union  = new Set([...A, ...B]).size || 1;
  return shared / union;
}

function coiColor(v: number) {
  if (v > 10) return "text-red-600";
  if (v > 5)  return "text-orange-500";
  return "text-green-600";
}
function alcColor(v: number) {
  if (v < 0.7) return "text-red-600";
  if (v < 0.9) return "text-orange-500";
  return "text-green-600";
}
function corColor(v: number) {
  if (v > 0.5) return "text-red-600";
  if (v > 0.25) return "text-orange-500";
  return "text-green-600";
}

// ---------- Grid placement ----------
// We build placements that respect row spans so the layout is:
// col0: 1 box spanning all rows
// col1: 2 boxes, each spanning half the rows
// col2: 4 boxes, each spanning quarter, etc.
type Cell = {
  dog?: Dog;
  col: number;           // 1-based
  rowStart: number;      // 1-based
  rowSpan: number;       // rows to span
};

function placePedigree(
  dog: Dog | undefined,
  dogs: Dog[],
  genIndex: number,      // 0-based
  maxGens: number,
  rowStart: number,      // 1-based
  rowSpan: number,
  out: Cell[]
) {
  // push current node
  out.push({ dog, col: genIndex + 1, rowStart, rowSpan });

  if (genIndex >= maxGens - 1) return; // reached last column

  const half = Math.max(1, Math.floor(rowSpan / 2));
  const sire = dog ? findDog(dog.Sire, dogs) : undefined;
  const dam  = dog ? findDog(dog.Dam,  dogs) : undefined;

  // sire goes on top half, dam on bottom half
  placePedigree(sire, dogs, genIndex + 1, maxGens, rowStart, half, out);
  placePedigree(dam,  dogs, genIndex + 1, maxGens, rowStart + half, half, out);
}

// Export a DOM node to a single-page PDF using html-to-image (no OKLCH parsing)
async function exportNodeToPDF(node: HTMLElement, filename: string) {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ] as const);

  // Measure full content (not just viewport)
  const widthPx  = Math.max(node.scrollWidth,  Math.ceil(node.getBoundingClientRect().width));
  const heightPx = Math.max(node.scrollHeight, Math.ceil(node.getBoundingClientRect().height));

  // Ask the browser to render a canvas of the node (supports OKLCH)
  const canvas = await toCanvas(node, {
    cacheBust: true,
    pixelRatio: 2,                  // sharper text
    width: widthPx,
    height: heightPx,
    // Force black text / white bg for everything in the subtree
    style: {
      color: "#000",
      backgroundColor: "#fff",
    },
    // Optional: strip box-shadows & background images (keeps things crisp)
    filter: (n) => {
      if (!(n instanceof Element)) return true;
      const cs = window.getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") (n as HTMLElement).style.backgroundImage = "none";
      if (cs.boxShadow && cs.boxShadow !== "none") (n as HTMLElement).style.boxShadow = "none";
      return true;
    },
  });

  // Build a one-page PDF (Letter landscape; change to "a4" if you prefer)
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;

  // px → pt (96 CSS px = 72 pt)
  const PT_PER_PX = 72 / 96;
  const canvasWpt = canvas.width  * PT_PER_PX;
  const canvasHpt = canvas.height * PT_PER_PX;

  const scale = Math.min(availW / canvasWpt, availH / canvasHpt);
  const renderW = canvasWpt * scale;
  const renderH = canvasHpt * scale;

  const x = (pageW - renderW) / 2;
  const y = (pageH - renderH) / 2;

  pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", x, y, renderW, renderH, undefined, "FAST");
  pdf.save(filename);
}


// ---------- Component ----------
export default function PedigreeTable({ rootDog, dogs, generations = 5 }: PedigreeTableProps) {
  const totalRows = Math.pow(2, Math.max(0, generations - 1));
  const colWidth = 260;

  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    placePedigree(rootDog, dogs, 0, generations, 1, totalRows, out);
    return out;
  }, [rootDog, dogs, generations, totalRows]);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const colBg = ["bg-white", "bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-rose-50", "bg-purple-50"];

  // 🔧 remove the outer border here; we'll put the border on the grid cell wrapper
  const renderBox = (dog?: Dog) => {
    if (!dog) {
      return (
        <div className="h-full w-full p-2 text-xs italic text-gray-400 bg-white">
          Unknown
        </div>
      );
    }
    const coi = approxCOIofDog(dog, dogs, generations);
    const alc = approxALCofDog(dog, dogs, generations);
    const cor = approxCORofParents(dog, dogs, generations);

    return (
  <div className="h-full w-full flex flex-col justify-center p-2 text-xs leading-tight bg-white">
    <p className="font-semibold text-[13px] text-blue-900 text-center">{dog.Name}</p>
    {dog.Titles && <p className="text-gray-600 text-center">{dog.Titles}</p>}
    <p className="text-[11px] mt-1 text-gray-600 text-center">
      {dog.Breed || "Unknown Breed"}{dog.Color ? ` • ${dog.Color}` : ""}{dog.Sex ? ` • ${dog.Sex}` : ""}
    </p>
    <p className="text-[11px] text-gray-500 text-center">DOB: {dog["Date of Birth"] || "—"}</p>
    <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">…</div>
  </div>
);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Pedigree</h3>
        <button
        onClick={() =>
            exportNodeToPDF(
            wrapRef.current!,
            `${(rootDog.Name || "pedigree").replace(/\W+/g, "_")}.pdf`
            )
        }
        className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 shadow-sm"
        >
        Export PDF
        </button>

      </div>

      {/* GRID */}
      <div
        ref={wrapRef}
        className="overflow-x-auto rounded-md border bg-white"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${generations}, ${colWidth}px)`,
          gridTemplateRows: `repeat(${totalRows}, minmax(74px, auto))`,
          gap: "0px",          // 🔧 no gutter so borders meet
          padding: "0px",      // 🔧 no extra padding around grid
        }}
      >
        {/* Column shading (kept) */}
        {Array.from({ length: generations }).map((_, i) => (
          <div
            key={`bg-${i}`}
            style={{ gridColumn: `${i + 1} / ${i + 2}`, gridRow: `1 / ${totalRows + 1}` }}
            className={`${colBg[i] || "bg-gray-50"} -z-10`}
          />
        ))}

        {/* Each grid item has the border so it fills the whole cell */}
        {cells.map((c, idx) => (
          <div
            key={idx}
            style={{
              gridColumn: `${c.col} / ${c.col + 1}`,
              gridRow: `${c.rowStart} / span ${c.rowSpan}`,
            }}
            className="h-full w-full border border-gray-300 rounded-md bg-white box-border"
          >
            {renderBox(c.dog)}
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Tip: Use <span className="font-medium">Export PDF</span> above, or your browser’s{" "}
        <span className="font-medium">Print → Save as PDF</span>.
      </p>
    </div>
  );
}
