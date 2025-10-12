import React from "react";

interface Dog {
  Name: string;
  Sex: string;
  "Date of Birth": string;
  Sire: string;
  Dam: string;
  Titles: string;
  Breeder: string;
  Owner: string;
  "Registration Number": string;
  Breed: string;
  Color: string;
  [key: string]: any;
}

export function Table({
  data,
  onSelectDog,
}: {
  data: Dog[];
  onSelectDog?: (dog: Dog) => void;
}) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No records found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
          <tr>
            {[
              "Name",
              "Sex",
              "Date of Birth",
              "Sire",
              "Dam",
              "Titles",
              "Breeder",
              "Owner",
              "Registration Number",
              "Breed",
              "Color",
            ].map((header) => (
              <th key={header} className="px-4 py-2 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((dog, i) => (
            <tr
              key={i}
              onClick={() => onSelectDog?.(dog)}
              className={`cursor-pointer ${
                i % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-blue-50 transition-colors`}
            >
              <td className="px-4 py-2 font-medium text-blue-700 underline">
                {dog.Name}
              </td>
              <td className="px-4 py-2">{dog.Sex}</td>
              <td className="px-4 py-2">{dog["Date of Birth"]}</td>
              <td className="px-4 py-2">{dog.Sire}</td>
              <td className="px-4 py-2">{dog.Dam}</td>
              <td className="px-4 py-2">{dog.Titles}</td>
              <td className="px-4 py-2">{dog.Breeder}</td>
              <td className="px-4 py-2">{dog.Owner}</td>
              <td className="px-4 py-2">{dog["Registration Number"]}</td>
              <td className="px-4 py-2">{dog.Breed}</td>
              <td className="px-4 py-2">{dog.Color}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
