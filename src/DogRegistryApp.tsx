import { useEffect, useState } from "react"
import Papa from "papaparse"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

// Adjust this path if your CSV is elsewhere
import dogData from "/test_export_fixed_with_headers.csv?url"

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
}

export default function DogRegistryApp() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({
    Breed: "",
    Color: "",
    Sex: "",
  })

  useEffect(() => {
    Papa.parse<Dog>(dogData, {
      header: true,
      download: true,
      complete: (results) => {
        setDogs(results.data.filter((row) => row.Name)) // filter empty rows
      },
    })
  }, [])

  const filteredDogs = dogs.filter((dog) => {
    const matchesSearch =
      dog.Name?.toLowerCase().includes(search.toLowerCase()) ||
      dog.Breeder?.toLowerCase().includes(search.toLowerCase()) ||
      dog.Owner?.toLowerCase().includes(search.toLowerCase())

    const matchesBreed = !filters.Breed || dog.Breed === filters.Breed
    const matchesColor = !filters.Color || dog.Color === filters.Color
    const matchesSex = !filters.Sex || dog.Sex === filters.Sex

    return matchesSearch && matchesBreed && matchesColor && matchesSex
  })

  // Unique dropdown options
  const breeds = Array.from(new Set(dogs.map((d) => d.Breed))).sort()
  const colors = Array.from(new Set(dogs.map((d) => d.Color))).sort()
  const sexes = Array.from(new Set(dogs.map((d) => d.Sex))).sort()

  return (
    <div className="flex flex-col items-center p-6">
      {/* Filters + search */}
      <div className="flex flex-wrap gap-4 mb-6 w-full max-w-5xl">
        <Input
          placeholder="Search by name, breeder, owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />

        <Select onValueChange={(val) => setFilters((f) => ({ ...f, Breed: val }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by breed" />
          </SelectTrigger>
          <SelectContent>
            {breeds.map((b) => (
              <SelectItem key={b} value={b} className="pl-8">
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => setFilters((f) => ({ ...f, Color: val }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by color" />
          </SelectTrigger>
          <SelectContent>
            {colors.map((c) => (
              <SelectItem key={c} value={c} className="pl-8">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => setFilters((f) => ({ ...f, Sex: val }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by sex" />
          </SelectTrigger>
          <SelectContent>
            {sexes.map((s) => (
              <SelectItem key={s} value={s} className="pl-8">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="w-full max-w-5xl shadow-lg">
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDogs.map((dog, i) => (
                  <TableRow key={i}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
