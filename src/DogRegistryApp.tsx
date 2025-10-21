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
import PedigreeTable from "@/components/PedigreeTable";
import TrialPedigree from "@/components/TrialPedigree";

// -----------------------------
// Interface
// -----------------------------
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

// -----------------------------
// Utility Functions
// -----------------------------
function getAncestors(dog: Dog, dogs: Dog[], depth: number): Set<string> {
  const ancestors = new Set<string>();
  const queue: { dog: Dog | undefined; level: number }[] = [{ dog, level: 0 }];

  while (queue.length > 0) {
    const { dog, level } = queue.shift()!;
    if (!dog || level >= depth) continue;

    [dog.Sire, dog.Dam].forEach((parentName) => {
      const parent = dogs.find((d) => d.Name === parentName);
      if (parent) {
        ancestors.add(parent.Name);
        queue.push({ dog: parent, level: level + 1 });
      }
    });
  }
  return ancestors;
}

function calculateCOI(sire: Dog, dam: Dog, dogs: Dog[]): number {
  const sireAncestors = getAncestors(sire, dogs, 6);
  const damAncestors = getAncestors(dam, dogs, 6);
  const shared = [...sireAncestors].filter((a) => damAncestors.has(a));
  return (shared.length / Math.max(sireAncestors.size, damAncestors.size || 1)) * 25;
}

function calculateALC(dog: Dog, dogs: Dog[]): number {
  const ancestors = getAncestors(dog, dogs, 6);
  const possibleAncestors = Math.pow(2, 6) - 2; // parents through 6 generations
  return Math.min(1, ancestors.size / possibleAncestors);
}

function calculateCOR(sire: Dog, dam: Dog, dogs: Dog[]): number {
  const sireAncestors = getAncestors(sire, dogs, 6);
  const damAncestors = getAncestors(dam, dogs, 6);
  const shared = [...sireAncestors].filter((a) => damAncestors.has(a));
  return shared.length / (sireAncestors.size + damAncestors.size - shared.length || 1);
}

// -----------------------------
// Component
// -----------------------------
export default function DogRegistryApp() {
  const [data, setData] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [activeTab, setActiveTab] = useState("registry");

  useEffect(() => {
    const tryFiles = ["test_export_fixed_with_headers.csv", "test_export.csv"];
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

  const filteredDogs = data.filter((dog) =>
    [dog.Name, dog.Breeder, dog.Owner].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const year = new Date().getFullYear();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        American Hairless Terrier Pedigree Database
      </h1>

      <Tabs defaultValue="registry" className="w-full" onValueChange={setActiveTab}>
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
              <div className="w-full max-w-2xl border rounded-md shadow-sm">
                <Command className="w-full">
                  <CommandInput
                    placeholder="Type to search name, breeder, or owner..."
                    className="h-10 text-base"
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList className="max-h-[75vh] overflow-y-auto">
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
                              Breeder: {dog.Breeder || "N/A"} | Owner: {dog.Owner || "N/A"}
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

              {/* 🧬 Pedigree Modal */}
              <Dialog open={!!selectedDog} onOpenChange={() => setSelectedDog(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Pedigree: {selectedDog?.Name}</DialogTitle>
                  </DialogHeader>
                  {selectedDog && (
                    <div>
                      {/* COI, ALC, COR display */}
                      <div className="grid grid-cols-3 text-center mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600">COI</p>
                          <p className="text-lg font-bold text-blue-600">
                            {(() => {
                              const sire = data.find((d) => d.Name === selectedDog.Sire);
                              const dam = data.find((d) => d.Name === selectedDog.Dam);
                              if (!sire || !dam) return "N/A";
                              return `${calculateCOI(sire, dam, data).toFixed(2)}%`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">ALC</p>
                          <p className="text-lg font-bold text-green-600">
                            {`${(calculateALC(selectedDog, data) * 100).toFixed(1)}%`}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">COR</p>
                          <p className="text-lg font-bold text-purple-600">
                            {(() => {
                              const sire = data.find((d) => d.Name === selectedDog.Sire);
                              const dam = data.find((d) => d.Name === selectedDog.Dam);
                              if (!sire || !dam) return "N/A";
                              return `${(calculateCOR(sire, dam, data) * 100).toFixed(1)}%`;
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Pedigree Tree */}
                      <PedigreeTable rootDog={selectedDog} dogs={data} generations={5} />
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>

        {/* 🧪 TRIAL TAB */}
        <TabsContent value="trial">
          {loading ? (
            <div className="fixed inset-0 flex flex-col justify-center items-center bg-white/80 backdrop-blur-sm z-50 text-center">
              <div className="h-16 w-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-gray-800 text-xl font-semibold">Loading pedigree data...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while the simulator loads.</p>
            </div>
          ) : (
            <TrialPedigree dogs={data} />
          )}
        </TabsContent>
        
        <footer className="fixed bottom-0 left-0 w-full text-center text-xs text-gray-500 py-2 bg-white/80 backdrop-blur-sm border-t border-gray-200 print:hidden">
          © {new Date().getFullYear()} Made by <span className="font-medium">Gina Dean</span>
        </footer>
      </Tabs>
    </div>
  );
}
