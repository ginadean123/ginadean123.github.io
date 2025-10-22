import { useMemo, useState } from "react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// ⛔️ was PedigreeView
import PedigreeTable from "@/components/PedigreeTable";
import { calculateALC, calculateCOI, calculateCOR } from "@/utils/genetics";

interface Dog {
  Name: string;
  Sire: string;
  Dam: string;
  Sex?: string;
  "Date of Birth"?: string;
  [key: string]: any;
}

function getAge(dog: Dog): number {
  const dob = dog["Date of Birth"];
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;
  const diff = Date.now() - birthDate.getTime();
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

export default function TrialPedigree({ dogs }: { dogs: Dog[] }) {
  const [sireName, setSireName] = useState("");
  const [damName, setDamName] = useState("");
  const [sireQuery, setSireQuery] = useState("");
  const [damQuery, setDamQuery] = useState("");

  // Filter sires: only "Dog" and <= 20 years old
  const sires = useMemo(
    () =>
      dogs.filter(
        (d) =>
          d.Sex?.toLowerCase() === "dog" &&
          getAge(d) <= 20 &&
          d.Name?.toLowerCase().includes(sireQuery.toLowerCase())
      ),
    [dogs, sireQuery]
  );

  // Filter dams: only "Bitch" and <= 20 years old
  const dams = useMemo(
    () =>
      dogs.filter(
        (d) =>
          d.Sex?.toLowerCase() === "bitch" &&
          getAge(d) <= 20 &&
          d.Name?.toLowerCase().includes(damQuery.toLowerCase())
      ),
    [dogs, damQuery]
  );

  const sire = dogs.find((d) => d.Name === sireName);
  const dam = dogs.find((d) => d.Name === damName);

  const coi =
    sire && dam
      ? // Your genetics util currently accepts (offspring, dogs)
        calculateCOI({ Name: "Trial Pup", Sire: sire.Name, Dam: dam.Name } as Dog, dogs)
      : 0;

  const alc =
    sire && dam ? (calculateALC(sire, dogs) + calculateALC(dam, dogs)) / 2 : 0;

  const cor = sire && dam ? calculateCOR(sire, dam, dogs) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">Trial Pedigree Simulator</h2>

      <div className="flex flex-wrap items-start justify-center gap-8">
        {/* SIRE SELECTOR */}
        <div className="w-72">
          <p className="text-sm font-medium mb-1">Select Sire (Dog)</p>
          <Command className="border rounded-md shadow-sm">
            <CommandInput
              placeholder="Type to search sire..."
              className="h-9 text-sm"
              value={sireQuery}
              onValueChange={setSireQuery}
            />
            <CommandList className="max-h-[500px] overflow-y-auto text-sm">
              <CommandGroup>
                {sires.map((d) => (
                  <CommandItem
                    key={d.Name}
                    onSelect={() => setSireName(d.Name)}
                    className="py-1"
                  >
                    {d.Name}
                    {d["Date of Birth"] && (
                      <span className="ml-auto text-xs text-gray-400">
                        ({getAge(d).toFixed(1)} yrs)
                      </span>
                    )}
                  </CommandItem>
                ))}
                {sires.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No matching sires
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
          {sireName && (
            <p className="text-xs text-muted-foreground mt-1">Selected: {sireName}</p>
          )}
        </div>

        {/* DAM SELECTOR */}
        <div className="w-72">
          <p className="text-sm font-medium mb-1">Select Dam (Bitch)</p>
          <Command className="border rounded-md shadow-sm">
            <CommandInput
              placeholder="Type to search dam..."
              className="h-9 text-sm"
              value={damQuery}
              onValueChange={setDamQuery}
            />
            <CommandList className="max-h-[500px] overflow-y-auto text-sm">
              <CommandGroup>
                {dams.map((d) => (
                  <CommandItem
                    key={d.Name}
                    onSelect={() => setDamName(d.Name)}
                    className="py-1"
                  >
                    {d.Name}
                    {d["Date of Birth"] && (
                      <span className="ml-auto text-xs text-gray-400">
                        ({getAge(d).toFixed(1)} yrs)
                      </span>
                    )}
                  </CommandItem>
                ))}
                {dams.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No matching dams
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
          {damName && (
            <p className="text-xs text-muted-foreground mt-1">Selected: {damName}</p>
          )}
        </div>
      </div>

      {sire && dam ? (
        <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-md border text-sm">
          <div className="flex flex-wrap gap-6 mb-4">
            <p><strong>COI:</strong> {coi.toFixed(2)}%</p>
            <p><strong>ALC:</strong> {alc.toFixed(2)}</p>
            <p><strong>COR:</strong> {cor.toFixed(2)}%</p>
          </div>

          {/* 👉 Table view instead of tree */}
          <PedigreeTable
            rootDog={{ Name: "Trial Pup", Sire: sire.Name, Dam: dam.Name } as Dog}
            dogs={dogs}
            generations={5}
          />
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          Pick a sire and a dam to view the simulated pedigree.
        </p>
      )}
    </div>
  );
}
