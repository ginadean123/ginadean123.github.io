// src/utils/genetics.ts
interface Dog {
  Name: string;
  Sire: string;
  Dam: string;
  [key: string]: any;
}

// Recursively collect ancestors
function getAncestors(dog: Dog | undefined, dogs: Dog[], depth: number): Set<string> {
  const ancestors = new Set<string>();
  if (!dog || depth <= 0) return ancestors;

  const sire = dogs.find((d) => d.Name === dog.Sire);
  const dam = dogs.find((d) => d.Name === dog.Dam);

  if (sire) {
    ancestors.add(sire.Name);
    for (const a of getAncestors(sire, dogs, depth - 1)) ancestors.add(a);
  }
  if (dam) {
    ancestors.add(dam.Name);
    for (const a of getAncestors(dam, dogs, depth - 1)) ancestors.add(a);
  }

  return ancestors;
}

// COI – Approximate coefficient of inbreeding
export function calculateCOI(rootDog: Dog, dogs: Dog[], generations = 6): number {
  const sire = dogs.find((d) => d.Name === rootDog.Sire);
  const dam = dogs.find((d) => d.Name === rootDog.Dam);
  if (!sire || !dam) return 0;

  const sireAncestors = getAncestors(sire, dogs, generations);
  const damAncestors = getAncestors(dam, dogs, generations);
  const common = [...sireAncestors].filter((a) => damAncestors.has(a));

  const coi = Math.min((common.length / (sireAncestors.size + damAncestors.size)) * 25, 25);
  return isNaN(coi) ? 0 : coi;
}

// ALC – Ancestor Loss Coefficient
export function calculateALC(rootDog: Dog, dogs: Dog[], generations = 6): number {
  const allAncestors = getAncestors(rootDog, dogs, generations);
  const totalPossible = Math.pow(2, generations) - 2; // 126 for 6 gens
  const alc = allAncestors.size / totalPossible;
  return isNaN(alc) ? 0 : alc;
}

// COR – Coefficient of Relationship between two dogs
export function calculateCOR(dog1: Dog, dog2: Dog, dogs: Dog[], generations = 6): number {
  const a1 = getAncestors(dog1, dogs, generations);
  const a2 = getAncestors(dog2, dogs, generations);
  const common = [...a1].filter((a) => a2.has(a));
  const cor = (common.length / ((a1.size + a2.size) / 2)) * 50; // scale to %
  return isNaN(cor) ? 0 : cor;
}
