import { useEffect, useState } from "react"
import Papa from "papaparse"
import { Card, CardContent } from "./components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog"
import PedigreeView from "./components/PedigreeView"

interface Dog {
  Name: string
  Sire: string
  Dam: string
  Breeder: string
  Owner: string
  RegNo: string
  Breed: string
  Coat: string
  Titles: string
  "Date of Birth": string
  [key: string]: any
}

export default function DogRegistryApp() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [coiCache] = useState<Map<string, number>>(new Map())
  const [alcCache] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    fetch("test_export_fixed_with_headers.csv")
      .then((res) => res.text())
      .then((text) => {
        const { data } = Papa.parse<Dog>(text, { header: true, delimiter: "\t" })
        setDogs(data.filter((d) => d.Name))
      })
  }, [])

  const getCOI = (dog: Dog): number => {
    if (coiCache.has(dog.Name)) return coiCache.get(dog.Name)!
    const val = calculateCOI(dog, dogs, 5)
    coiCache.set(dog.Name, val)
    return val
  }

  const getALC = (dog: Dog): number => {
    if (alcCache.has(dog.Name)) return alcCache.get(dog.Name)!
    const val = calculateALC(dog, dogs, 5)
    alcCache.set(dog.Name, val)
    return val
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg rounded-2xl">
        <CardContent>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Breed</th>
                <th className="p-2">DOB</th>
                <th className="p-2">COI</th>
                <th className="p-2">ALC</th>
                <th className="p-2">Pedigree</th>
              </tr>
            </thead>
            <tbody>
              {dogs.slice(0, 50).map((dog, i) => (
                <tr key={i} className="border-b hover:bg-muted/40">
                  <td className="p-2">{dog.Name}</td>
                  <td className="p-2">{dog.Breed}</td>
                  <td className="p-2">{dog["Date of Birth"]}</td>
                  <td className="p-2">{getCOI(dog).toFixed(2)}%</td>
                  <td className="p-2">{getALC(dog).toFixed(2)}%</td>
                  <td className="p-2">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => setSelectedDog(dog)}
                    >
                      View Pedigree
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDog} onOpenChange={() => setSelectedDog(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              Pedigree for {selectedDog?.Name}
            </DialogTitle>
          </DialogHeader>
          {selectedDog && (
            <PedigreeView rootDog={selectedDog} dogs={dogs} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** --- helper calculations (same as PedigreeView, but shallow cached version) --- **/

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
