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

interface Dog {
  [key: string]: any;
}

export default function DogRegistryApp() {
  const [data, setData] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tryFiles = [
      "test_export_fixed_with_headers.csv", // file in /public
      "test_export.csv",
    ];

    const loadData = async () => {
      for (const file of tryFiles) {
        try {
          const res = await fetch(file);
          if (!res.ok) continue;

          const text = await res.text();
          const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          });

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

      setError("No CSV file found in /public folder.");
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        No data available.
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Dog Registry</h1>

      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="font-semibold text-sm">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <TableCell key={col} className="text-sm">
                    {row[col] || ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
