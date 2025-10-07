import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/ui/table";
import PedigreeView from "./components/PedigreeView";

interface Dog {
  Name: string;
  Sire: string;
  Dam: string;
  Titles: string;
  "Date of Birth": string;
  [key: string]: any;
}

export default function DogRegistryApp() {
  const [data, setData] = useState<Dog[]>([]);
  const [filtered, setFiltered] = useState<Dog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Load CSV data ---
  useEffect(() => {
    const tryFiles = [
      "test_export_fixed_with_headers.csv", // main file
      "test_export.csv",                    // fallback
    ];

    const loadData = async () => {
      for (const file of tryFiles) {
        try {
          const res = await fetch(file);
          if (!res.ok) continue;
          const text = await res.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          const dogs = parsed.data as Dog[];
          setData(dogs);
          setFiltered(dogs);
          console.log(`✅ Loaded data from ${file}`);
          console.log("🔍 Sample row:", dogs[0]);
          setLoading(false);
          return;
        } catch (err) {
          console.warn(`⚠️ Failed to load ${file}`, err);
        }
      }
      console.error("❌ No CSV file found in /public");
      setLoading(false);
    };

    loadData();
  }, []);

  // --- Filter by search ---
  useEffect(() => {
    if (!search.trim()) setFiltered(data);
    else {
      const q = search.toLowerCase();
      setFiltered(
        data.filter(
          (d) =>
            d.Name?.toLowerCase().includes(q) ||
            d.Owner?.toLowerCase().includes(q) ||
            d.Breeder?.toLowerCase().includes(q) ||
            d.Registration?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, data]);

  // --- Handle dog selection ---
  const handleSelectDog = (dog: Dog) => {
    setSelectedDog(dog);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Dog Registry</h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading data...</p>
      ) : (
        <>
          <div className="mb-6 flex justify-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dogs by name, owner, or breeder..."
              className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md focus:ring focus:ring-blue-300"
            />
          </div>

          {selectedDog ? (
            <div className="mb-8 bg-white rounded-lg shadow p-4">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Pedigree for {selectedDog.Name}
              </h2>
              <PedigreeView rootDog={selectedDog} dogs={data} />
              <div className="text-center mt-4">
                <button
                  onClick={() => setSelectedDog(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Table
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Titles</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Registration #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dog, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-100">
                      <TableCell>
                        <button
                          onClick={() => handleSelectDog(dog)}
                          className="text-blue-600 hover:underline"
                        >
                          {dog.Name || "Unnamed"}
                        </button>
                      </TableCell>
                      <TableCell>{dog.Sex || ""}</TableCell>
                      <TableCell>{dog.Breed || ""}</TableCell>
                      <TableCell>{dog.Titles || ""}</TableCell>
                      <TableCell>{dog["Date of Birth"] || ""}</TableCell>
                      <TableCell>{dog.Owner || ""}</TableCell>
                      <TableCell>{dog["Registration Number"] || ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
