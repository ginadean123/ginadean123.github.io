import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./components/ui/table";
import { Select } from "./components/ui/select";
import { Button } from "./components/ui/button";

interface Dog {
  ID: string;
  Name: string;
  Breed: string;
  Color: string;
  Sex: string;
  Breeder: string;
  Owner: string;
  [key: string]: string;
}

const DogRegistryApp: React.FC = () => {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [filteredDogs, setFilteredDogs] = useState<Dog[]>([]);
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");

  useEffect(() => {
    const csvPath = `${import.meta.env.BASE_URL}test_export_padded.csv`;

    Papa.parse(csvPath, {
      header: true,
      download: true,
      complete: (result) => {
        setDogs(result.data as Dog[]);
        setFilteredDogs(result.data as Dog[]);
      },
    });
  }, []);

  useEffect(() => {
    let result = dogs;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.Name?.toLowerCase().includes(query) ||
          d.Breeder?.toLowerCase().includes(query) ||
          d.Owner?.toLowerCase().includes(query)
      );
    }

    if (breedFilter) {
      result = result.filter((d) => d.Breed === breedFilter);
    }
    if (colorFilter) {
      result = result.filter((d) => d.Color === colorFilter);
    }
    if (sexFilter) {
      result = result.filter((d) => d.Sex === sexFilter);
    }

    setFilteredDogs(result);
  }, [search, breedFilter, colorFilter, sexFilter, dogs]);

  const breeds = Array.from(new Set(dogs.map((d) => d.Breed))).filter(Boolean);
  const colors = Array.from(new Set(dogs.map((d) => d.Color))).filter(Boolean);
  const sexes = Array.from(new Set(dogs.map((d) => d.Sex))).filter(Boolean);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Dog Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name, breeder, or owner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-1 rounded-md w-1/3"
            />
            <Select value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
              <option value="">All Breeds</option>
              {breeds.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
            <Select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
              <option value="">All Colors</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select value={sexFilter} onChange={(e) => setSexFilter(e.target.value)}>
              <option value="">All Sexes</option>
              {sexes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Button onClick={() => setSearch("")}>Clear</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Breeder</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDogs.map((dog, idx) => (
                <TableRow key={idx}>
                  <TableCell>{dog.ID}</TableCell>
                  <TableCell>{dog.Name}</TableCell>
                  <TableCell>{dog.Breed}</TableCell>
                  <TableCell>{dog.Color}</TableCell>
                  <TableCell>{dog.Sex}</TableCell>
                  <TableCell>{dog.Breeder}</TableCell>
                  <TableCell>{dog.Owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DogRegistryApp;
