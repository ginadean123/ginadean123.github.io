import { useState, useEffect } from "react"
import Papa from "papaparse"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import PedigreeView from "@/components/PedigreeView"

interface Dog {
  Name: string
  Sex: string
  "Date of Birth": string
  Sire: string
  Dam: string
  Titles: string
  Breeder: string
  Owner: string
  "Registration Number": string
  Breed: string
  Color: string
  [key: string]: any
}

export default function DogRegistryApp() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [search, setSearch] = useState("")
  const [breedFilter, setBreedFilter] = useState<string>("")
  const [colorFilter, setColorFilter] = useState<string>("")
  const [sexFilter, setSexFilter] = useState<string>("")

  useEffect(() => {
    fetch("/test_export_fixed_with_headers.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse<Dog>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => setDogs(result.data),
        })
      })
  }, [])

  const filteredDogs = dogs.filter((dog) => {
    const matchesSearch =
      dog.Name?.toLowerCase().includes(search.toLowerCase()) ||
      dog.Breeder?.toLowerCase().includes(search.toLowerCase()) ||
      dog.Owner?.toLowerCase().includes(search.toLowerCase()) ||
      dog.Sire?.toLowerCase().includes(search.toLowerCase()) ||
      dog.Dam?.toLowerCase().includes(search.toLowerCase())

    const matchesBreed =
      !breedFilter || dog.Breed?.toLowerCase() === breedFilter.toLowerCase()
    const matchesColor =
      !colorFilter || dog.Color?.toLowerCase() === colorFilter.toLowerCase()
    const matchesSex =
      !sexFilter || dog.Sex?.toLowerCase() === sexFilter.toLowerCase()

    return matchesSearch && matchesBreed && matchesColor && matchesSex
  })

  // Prevent empty dropdown items
  const breeds = Array.from(
    new Set(dogs.map((d) => d.Breed).filter((b) => b && b.trim() !== ""))
  )
  const colors = Array.from(
    new Set(dogs.map((d) => d.Color).filter((c) => c && c.trim() !== ""))
  )
  const sexes = Array.from(
    new Set(dogs.map((d) => d.Sex).filter((s) => s && s.trim() !== ""))
  )

  return (
    <div className="flex flex-col items-center p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 w-full max-w-5xl">
        <Input
          placeholder="Search by name, breeder, owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[240px]"
        />

        <Select onValueChange={setBreedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by breed" />
          </SelectTrigger>
          <SelectContent>
            {breeds.map((breed, i) => (
              <SelectItem key={i} value={breed}>
                {breed}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setColorFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by color" />
          </SelectTrigger>
          <SelectContent>
            {colors.map((color, i) => (
              <SelectItem key={i} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setSexFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by sex" />
          </SelectTrigger>
          <SelectContent>
            {sexes.map((sex, i) => (
              <SelectItem key={i} value={sex}>
                {sex}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100 sticky top-0 z-10">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Sire</TableHead>
              <TableHead>Dam</TableHead>
              <TableHead>Titles</TableHead>
              <TableHead>Breeder</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Reg #</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDogs.map((dog, i) => (
              <TableRow
                key={i}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
              >
                <TableCell>{dog.Name}</TableCell>
                <TableCell>{dog.Sex}</TableCell>
                <TableCell>{dog["Date of Birth"]}</TableCell>
                <TableCell>{dog.Sire}</TableCell>
                <TableCell>{dog.Dam}</TableCell>
                <TableCell>{dog.Titles}</TableCell>
                <TableCell>{dog.Breeder}</TableCell>
                <TableCell>{dog.Owner}</TableCell>
                <TableCell>{dog["Registration Number"]}</TableCell>
                <TableCell>{dog.Breed}</TableCell>
                <TableCell>{dog.Color}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-blue-600 hover:underline">
                        View Pedigree
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                      <PedigreeView rootDog={dog} dogs={dogs} generations={5} />
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
