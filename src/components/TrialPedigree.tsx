import { useMemo, useState } from "react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

function getAgeYears(dog: Dog): number | null {
  const dob = dog["Date of Birth"];
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const diff = Date.now() - birthDate.getTime();
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

export default function TrialPedigree({ dogs }: { dogs: Dog[] }) {
  const [sireName, setSireName] = useState("");
  const [damName, setDamName] = useState("");
  const [sireQuery, setSireQuery] = useState("");
  const [damQuery, setDamQuery] = useState("");

  const sireReady = sireQuery.trim().length >= 2;
  const damReady = damQuery.trim().length >= 2;

  // Only show list while actively searching and not locked to selected value
  const showSireList = sireReady && (!sireName || sireQuery.trim() !== sireName.trim());
  const showDamList = damReady && (!damName || damQuery.trim() !== damName.trim());

  // Eligibility filters
  const eligibleSires = useMemo(
    () =>
      dogs.filter((d) => {
        if (d.Sex?.toLowerCase() !== "dog") return false;
        const age = getAgeYears(d);
        return !(age === null || age > 18);
      }),
    [dogs]
  );

  const eligibleDams = useMemo(
    () =>
      dogs.filter((d) => {
        if (d.Sex?.toLowerCase() !== "bitch") return false;
        const age = getAgeYears(d);
        return !(age === null || age > 18);
      }),
    [dogs]
  );

  const sire = dogs.find((d) => d.Name === sireName);
  const dam = dogs.find((d) => d.Name === damName);

  const coi =
    sire && dam
      ? calculateCOI({ Name: "Trial Pup", Sire: sire.Name, Dam: dam.Name } as Dog, dogs)
      : 0;

  const alc = sire && dam ? (calculateALC(sire, dogs) + calculateALC(dam, dogs)) / 2 : 0;
  const cor = sire && dam ? calculateCOR(sire, dam, dogs) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">Trial Pedigree Simulator</h2>

      {/* Sire & Dam Selectors (always side-by-side, fixed space below) */}
      <div className="flex w-full gap-8 mb-6 z-10">
        {/* SIRE SELECTOR */}
        <div className="relative basis-1/2 min-w-0">
          <p className="text-sm font-medium mb-1">Select Sire (Dog)</p>
          <Command className="border rounded-md shadow-sm w-full">
            <CommandInput
              placeholder="Type at least 2 letters to search..."
              className="h-9 text-sm"
              value={sireQuery}
              onValueChange={setSireQuery}
            />
            {showSireList && (
              <CommandList className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto text-sm border rounded-md bg-background shadow-lg">
                <CommandGroup>
                  {eligibleSires.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No eligible sires
                    </div>
                  )}
                  {eligibleSires.map((d) => {
                    const age = getAgeYears(d);
                    return (
                      <CommandItem
                        key={d.Name}
                        value={d.Name}
                        onSelect={() => {
                          setSireName(d.Name);
                          setSireQuery(d.Name); // lock to selection => collapses list
                        }}
                        className="py-1"
                      >
                        {d.Name}
                        {age !== null && (
                          <span className="ml-auto text-xs text-gray-400">
                            ({age.toFixed(1)} yrs)
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
          {sireName && (
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              Selected: {sireName}
            </p>
          )}
        </div>

        {/* DAM SELECTOR */}
        <div className="relative basis-1/2 min-w-0">
          <p className="text-sm font-medium mb-1">Select Dam (Bitch)</p>
          <Command className="border rounded-md shadow-sm w-full">
            <CommandInput
              placeholder="Type at least 2 letters to search..."
              className="h-9 text-sm"
              value={damQuery}
              onValueChange={setDamQuery}
            />
            {showDamList && (
              <CommandList className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto text-sm border rounded-md bg-background shadow-lg">
                <CommandGroup>
                  {eligibleDams.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No eligible dams
                    </div>
                  )}
                  {eligibleDams.map((d) => {
                    const age = getAgeYears(d);
                    return (
                      <CommandItem
                        key={d.Name}
                        value={d.Name}
                        onSelect={() => {
                          setDamName(d.Name);
                          setDamQuery(d.Name);
                        }}
                        className="py-1"
                      >
                        {d.Name}
                        {age !== null && (
                          <span className="ml-auto text-xs text-gray-400">
                            ({age.toFixed(1)} yrs)
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
          {damName && (
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              Selected: {damName}
            </p>
          )}
        </div>
      </div>

            {sire && dam ? (
        <div className="mt-16 bg-gray-50 dark:bg-neutral-900 p-4 rounded-md border text-sm relative z-0">
          <div className="flex flex-wrap gap-6 mb-4">
            <p><strong>COI:</strong> {coi.toFixed(2)}%</p>
            <p><strong>ALC:</strong> {alc.toFixed(2)}</p>
            <p><strong>COR:</strong> {cor.toFixed(2)}%</p>
          </div>
            <br></br>
            <br></br>
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
