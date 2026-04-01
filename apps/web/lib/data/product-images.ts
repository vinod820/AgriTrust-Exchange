const cropImageMap: Record<string, string> = {
  tomato: "/images/products/tomato.svg",
  rice: "/images/products/rice.svg",
  "green chilli": "/images/products/green-chilli.svg",
  chilli: "/images/products/green-chilli.svg",
  onion: "/images/products/onion.svg"
};

export function getProductImageForCrop(crop: string) {
  const normalized = crop.trim().toLowerCase();

  if (cropImageMap[normalized]) {
    return cropImageMap[normalized];
  }

  const partialMatch = Object.entries(cropImageMap).find(([key]) => normalized.includes(key));
  return partialMatch?.[1] ?? "/images/products/produce-placeholder.svg";
}

export const productImageLibrary = [
  {
    crop: "Tomato",
    path: "/images/products/tomato.svg"
  },
  {
    crop: "Rice",
    path: "/images/products/rice.svg"
  },
  {
    crop: "Green Chilli",
    path: "/images/products/green-chilli.svg"
  },
  {
    crop: "Onion",
    path: "/images/products/onion.svg"
  }
];
