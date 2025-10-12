import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PedigreeView from "@/components/PedigreeView";
import TrialPedigree from "@/components/TrialPedigree";

interface Dog {
  Name: string;
  Sire: string;
  Dam: string;
  Sex: string;
  Breed: string;
  Color: string;
  Breeder: string;
  Owner: string;
  Titles: string;
  "Date of Birth": string;
  [key: string]: any;
}

export default function DogRegistryApp() {
  const [data, setData] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);

  // Load CSV data
  useEffect(() => {
    const tryFiles = [
      "test_export_fixed_with_headers.csv",
      "test_export.csv",
    ];

    const loadData = async () => {
      for (const file of tryFiles) {
        try {
          const res = await fetch(file);
          if (!res.ok) continue;
          const text = await res.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          setData(parsed.data as Dog[]);
          console.log(`✅ Loaded data from ${file}`);
          console.log("🐕 Sample:", parsed.data[0]);
          console.log("🐾 Keys:", Object.keys(parsed.data[0] || {}));
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

  // Filter results dynamically
  const filteredDogs = data.filter((dog) =>
    [dog.Name, dog.Breeder, dog.Owner]
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Dog Registry</h1>

      <Tabs defaultValue="registry" className="w-full">
        <TabsList className="flex justify-center mb-6">
          <TabsTrigger value="registry">Registry</TabsTrigger>
          <TabsTrigger value="trial">Trial Pedigree Simulator</TabsTrigger>
        </TabsList>

        {/* 🐶 REGISTRY TAB */}
        <TabsContent value="registry">
          {loading ? (
            <p className="text-center text-gray-500">Loading data...</p>
          ) : (
            <div className="flex flex-col items-center">
              {/* Search */}
              <div className="w-full max-w-2xl border rounded-md shadow-sm">
                <Command className="w-full">
                  <CommandInput
                    placeholder="Type to search name, breeder, or owner..."
                    className="h-10 text-base"
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList className="h-[calc(100vh-250px)] overflow-y-auto">
                    <CommandGroup heading="Results">
                      {filteredDogs.map((dog) => (
                        <CommandItem
                          key={dog.Name}
                          className="py-2"
                          onSelect={() => setSelectedDog(dog)}
                        >
                          <div>
                            <p className="font-medium">{dog.Name}</p>
                            <p className="text-xs text-muted-foreground">
                              {dog.Breed || "Unknown Breed"} • {dog.Sex || "?"} •{" "}
                              {dog["Date of Birth"] || "Unknown DOB"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Breeder: {dog.Breeder || "N/A"} | Owner:{" "}
                              {dog.Owner || "N/A"}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                      {filteredDogs.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No matching dogs found.
                        </div>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>

              {/* Pedigree Modal */}
              <Dialog open={!!selectedDog} onOpenChange={() => setSelectedDog(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Pedigree: {selectedDog?.Name}
                    </DialogTitle>
                  </DialogHeader>
                  {selectedDog && (
                    <PedigreeView
                      rootDog={selectedDog}
                      dogs={data}
                      generations={5}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>

        {/* 🧬 TRIAL PEDIGREE TAB */}
        <TabsContent value="trial">
          <TrialPedigree dogs={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
