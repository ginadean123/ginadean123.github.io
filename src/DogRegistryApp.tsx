import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/ui/table";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";

interface Dog {
  [key: string]: any;
}

export default function DogRegistryApp() {
  const [data, setData] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBreed, setFilterBreed] = useState("");
  const [filterSex, setFilterSex] = useState("");
  const [filterColor, setFilterColor] = useState("");

  useEffect(() => {
    const tryFiles = ["test_export_fixed_with_headers.csv", "test_export.csv"];

    const loadData = async () => {
      for (const file of tryFiles) {
        try {
          const res = await fetch(file);
          if (!res.ok) continue;
          const text = await res.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          if (parsed.data && parsed.data.length > 0) {
            console.log("✅ Loaded data from", file);
            console.log("🔍 Sample row:", parsed.data[0]);
            setData(parsed.data as Dog[]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn(`⚠️ Failed to load ${file}`, err);
        }
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((dog) => {
      const textMatch = [dog.Name, dog.Owner, dog.Breeder, dog.Sire, dog.Dam, dog.Titles]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const breedMatch = filterBreed ? dog.Breed === filterBreed : true;
      const sexMatch = filterSex ? dog.Sex === filterSex : true;
      const colorMatch = filterColor ? dog.Color === filterColor : true;
      return textMatch && breedMatch && sexMatch && colorMatch;
    });
  }, [data, search, filterBreed, filterSex, filterColor]);

  const uniqueValues = (key: string) => {
    const values = data.map((d) => d[key]).filter(Boolean);
    return Array.from(new Set(values));
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Dog Registry</h1>

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <Input
          placeholder="Search by name, breeder, owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <Select onValueChange={setFilterBreed}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by Breed" />
          </SelectTrigger>
          <SelectContent>
            {uniqueValues("Breed").map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterSex}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter by Sex" />
          </SelectTrigger>
          <SelectContent>
            {uniqueValues("Sex").map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterColor}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Color" />
          </SelectTrigger>
          <SelectContent>
            {uniqueValues("Color").map((c) => (
              <SelectItem key={c} value={c}>
                {c || "(none)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Breeder</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Sire</TableHead>
              <TableHead>Dam</TableHead>
              <TableHead>Titles</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.map((dog, i) => (
              <TableRow key={i} className="hover:bg-gray-50">
                <TableCell>{dog.Name}</TableCell>
                <TableCell>{dog.Breed}</TableCell>
                <TableCell>{dog.Sex}</TableCell>
                <TableCell>{dog.Color}</TableCell>
                <TableCell>{dog.Breeder}</TableCell>
                <TableCell>{dog.Owner}</TableCell>
                <TableCell>{dog.Sire}</TableCell>
                <TableCell>{dog.Dam}</TableCell>
                <TableCell>{dog.Titles}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No dogs match your search.</p>
      )}
    </div>
  );
}
