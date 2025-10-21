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

// ---------- PDF export (html2canvas + jsPDF) ----------
async function exportNodeToPDF(node: HTMLElement, filename: string) {
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ] as const);
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const targetW = pageW - 40;
    const targetH = (canvas.height * targetW) / canvas.width;
    const y = Math.max(20, (pageH - targetH) / 2);

    pdf.addImage(img, "PNG", 20, y, targetW, targetH);
    pdf.save(filename);
  } catch (e) {
    console.warn("PDF libs missing; falling back to print()", e);
    window.print();
  }
}

// ---------- Component ----------
export default function PedigreeTable({ rootDog, dogs, generations = 5 }: PedigreeTableProps) {
  const totalRows = Math.pow(2, Math.max(0, generations - 1)); // e.g. 5 gens -> 16 rows
  const colWidth = 260; // px per column

  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    placePedigree(rootDog, dogs, 0, generations, 1, totalRows, out);
    return out;
  }, [rootDog, dogs, generations, totalRows]);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  const colBg = ["bg-white", "bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-rose-50", "bg-purple-50"];

  const renderBox = (dog?: Dog) => {
    if (!dog) {
      return (
        <div className="border rounded-md p-2 text-xs italic text-gray-400 bg-white min-h-[74px]">
          Unknown
        </div>
      );
    }
    const coi = approxCOIofDog(dog, dogs, generations);
    const alc = approxALCofDog(dog, dogs, generations);
    const cor = approxCORofParents(dog, dogs, generations);

    return (
      <div className="border rounded-md p-2 text-xs leading-tight bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <p className="font-semibold text-[13px] text-blue-900">{dog.Name}</p>
        {dog.Titles && <p className="text-gray-600">{dog.Titles}</p>}
        <p className="text-[11px] mt-1 text-gray-600">
          {dog.Breed || "Unknown Breed"}{dog.Color ? ` • ${dog.Color}` : ""}{dog.Sex ? ` • ${dog.Sex}` : ""}
        </p>
        <p className="text-[11px] text-gray-500">DOB: {dog["Date of Birth"] || "—"}</p>
        <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
          <div>
            <div className="text-gray-500">COI</div>
            <div className={`font-semibold ${coiColor(coi)}`}>{coi.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-gray-500">ALC</div>
            <div className={`font-semibold ${alcColor(alc)}`}>{(alc * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">COR</div>
            <div className={`font-semibold ${corColor(cor)}`}>{(cor * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Pedigree (Horizontal)</h3>
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

      {/* GRID: columns = generations, rows = 2^(gens-1) */}
      <div
        ref={wrapRef}
        className="overflow-x-auto rounded-md border bg-white"
        style={{
          // fixed column widths; rows auto-height but aligned by span
          display: "grid",
          gridTemplateColumns: `repeat(${generations}, ${colWidth}px)`,
          gridTemplateRows: `repeat(${totalRows}, minmax(74px, auto))`,
          gap: "8px",
          padding: "8px",
        }}
      >
        {/* Optional generation background shading */}
        {Array.from({ length: generations }).map((_, i) => (
          <div
            key={`bg-${i}`}
            style={{ gridColumn: `${i + 1} / ${i + 2}`, gridRow: `1 / ${totalRows + 1}` }}
            className={`-z-10 rounded ${colBg[i] || "bg-gray-50"}`}
          />
        ))}

        {/* Cells positioned by column and row span */}
        {cells.map((c, idx) => (
          <div
            key={idx}
            style={{
              gridColumn: `${c.col} / ${c.col + 1}`,
              gridRow: `${c.rowStart} / span ${c.rowSpan}`,
            }}
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
