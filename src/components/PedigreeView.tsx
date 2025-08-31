import { useMemo, useState } from "react"
import Tree from "react-d3-tree"

interface Dog {
  Name: string
  Sire: string
  Dam: string
  Titles: string
  "Date of Birth": string
  [key: string]: any
}

interface PedigreeProps {
  rootDog: Dog
  dogs: Dog[]
}

function buildTree(dog: Dog | undefined, dogs: Dog[], depth: number): any | null {
  if (!dog || depth <= 0) return null
  return {
    name: dog.Name || "Unknown",
    attributes: {
      title: dog.Titles || "",
      dob: dog["Date of Birth"] || "",
    },
    children: [
      buildTree(dogs.find((d) => d.Name === dog.Sire), dogs, depth - 1),
      buildTree(dogs.find((d) => d.Name === dog.Dam), dogs, depth - 1),
    ].filter(Boolean),
  }
}

/** --- COI + ALC calculations --- **/

function collectAncestors(dog: Dog | undefined, dogs: Dog[], depth: number, visited = new Set<string>()): Dog[] {
  if (!dog || depth <= 0) return []
  if (visited.has(dog.Name)) return []
  visited.add(dog.Name)
  const sire = dogs.find((d) => d.Name === dog.Sire)
  const dam = dogs.find((d) => d.Name === dog.Dam)
  return [dog, ...collectAncestors(sire, dogs, depth - 1, visited), ...collectAncestors(dam, dogs, depth - 1, visited)]
}

function calculateCOI(dog: Dog, dogs: Dog[], generations: number): number {
  const ancestors = collectAncestors(dog, dogs, generations)
  const seen = new Map<string, number>()
  let duplicateCount = 0
  ancestors.forEach((a) => {
    seen.set(a.Name, (seen.get(a.Name) || 0) + 1)
    if (seen.get(a.Name)! > 1) duplicateCount++
  })
  const total = ancestors.length || 1
  return (duplicateCount / total) * 100
}

function calculateALC(dog: Dog, dogs: Dog[], generations: number): number {
  const ancestors = collectAncestors(dog, dogs, generations)
  const unique = new Set(ancestors.map((a) => a.Name))
  const total = ancestors.length || 1
  return (unique.size / total) * 100
}

export default function PedigreeView({ rootDog, dogs }: PedigreeProps) {
  const [generations, setGenerations] = useState(5)

  const treeData = useMemo(
    () => buildTree(rootDog, dogs, generations),
    [rootDog, dogs, generations]
  )

  const coi = useMemo(() => calculateCOI(rootDog, dogs, generations), [rootDog, dogs, generations])
  const alc = useMemo(() => calculateALC(rootDog, dogs, generations), [rootDog, dogs, generations])

  if (!treeData) return <p>No pedigree data available.</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="font-semibold">COI:</p>
          <p>{coi.toFixed(2)}%</p>
        </div>
        <div>
          <p className="font-semibold">ALC:</p>
          <p>{alc.toFixed(2)}%</p>
        </div>
        <div>
          <label className="font-semibold mr-2">Generations:</label>
          <select
            value={generations}
            onChange={(e) => setGenerations(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ width: "100%", height: "600px" }}>
        <Tree
          data={treeData}
          orientation="vertical"
          translate={{ x: 400, y: 50 }}
          zoomable
          pathFunc="diagonal"
        />
      </div>
    </div>
  )
}
