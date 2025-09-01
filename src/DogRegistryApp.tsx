import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/ui/table";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tryFiles = [
      "test_export_fixed_with_headers.csv", // your renamed file in public/
      "test_export.csv",                    // fallback if needed
    ];

    const loadData = async () => {
      for (const file of tryFiles) {
        try {
          const res = await fetch(file);
          if (!res.ok) continue; // skip if 404
          const text = await res.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          setData(parsed.data as Dog[]);
          console.log(`✅ Loaded data from ${file}`);
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Dog Registry</h1>
      {loading ? (
        <p className="text-center text-gray-500">Loading data...</p>
      ) : data.length > 0 ? (
        <Table data={data} />
      ) : (
        <p className="text-center text-red-500">No data available.</p>
      )}
    </div>
  );
}
