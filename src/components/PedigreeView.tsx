import { useMemo } from "react";
import Tree from "react-d3-tree";

interface Dog {
  Name: string;
  Sire?: string;
  Dam?: string;
  Titles?: string;
  "Date of Birth"?: string;
  [key: string]: any;
}

interface PedigreeProps {
  rootDog: Dog;
  dogs: Dog[];
  generations?: number;
}

function buildTree(
  dog: Dog | undefined,
  dogs: Dog[],
  depth: number
): any | null {
  if (!dog || depth <= 0) return null;

  return {
    name: dog.Name || "Unknown",
    attributes: {
      title: dog.Titles || "",
      dob: dog["Date of Birth"] || "",
    },
    children: [
      buildTree(
        dogs.find((d) => d.Name === dog.Sire),
        dogs,
        depth - 1
      ),
      buildTree(
        dogs.find((d) => d.Name === dog.Dam),
        dogs,
        depth - 1
      ),
    ].filter(Boolean),
  };
}

export default function PedigreeView({
  rootDog,
  dogs,
  generations = 5,
}: PedigreeProps) {
  const treeData = useMemo(
    () => buildTree(rootDog, dogs, generations),
    [rootDog, dogs, generations]
  );

  if (!treeData) return <p>No pedigree data available.</p>;

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Tree
        data={treeData}
        orientation="vertical"
        translate={{ x: 400, y: 50 }}
        zoomable
        pathFunc="diagonal"
      />
    </div>
  );
}
