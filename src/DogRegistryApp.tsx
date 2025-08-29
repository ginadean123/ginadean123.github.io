import React, { useState, useEffect } from "react"
import Papa from "papaparse"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

interface Dog {
  [key: string]: string
}

const DogRegistryApp: React.FC = () => {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [search, setSearch] = useState("")
  const [breedFilter, setBreedFilter] = useState("all")
  const [colorFilter, setColorFilter] = useState("all")
  const [sexFilter, setSexFilter] = useState("all")

  useEffect(() => {
    Papa.parse("/test_export_fixed_with_headers.csv", {
      header: true,
      download: true,
      complete: (result) => {
        setDogs(result.data as Dog[])
      },
    })
  }, [])

  const breeds = Array.from(new Set(dogs.map((d) => d.Breed).filter(Boolean)))
  const colors = Array.from(new Set(dogs.map((d) => d.Color).filter(Boolean)))
  const sexes = Array.from(new Set(dogs.map((d) => d.Sex).filter(Boolean)))

  const filteredDogs = dogs.filter((dog) => {
    const matchesSearch =
      search === "" ||
      Object.values(dog)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesBreed = breedFilter === "all" || dog.Breed === breedFilter
    const matchesColor = colorFilter === "all" || dog.Color === colorFilter
    const matchesSex = sexFilter === "all" || dog.Sex === sexFilter

    return matchesSearch && matchesBreed && matchesColor && matchesSex
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Dog Registry</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search by name, breeder, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select onValueChange={setBreedFilter} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by breed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Breeds</SelectItem>
                {breeds.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setColorFilter} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {colors.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setSexFilter} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sexes</SelectItem>
                {sexes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(dogs[0] || {}).map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDogs.map((dog, idx) => (
                  <TableRow key={idx}>
                    {Object.values(dog).map((val, i) => (
                      <TableCell key={i}>{val}</TableCell>
                    ))}
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

export default DogRegistryApp
