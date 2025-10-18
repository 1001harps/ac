import { useState } from "react";

export const useInstance = <T extends any>(factory: () => T): T => {
  const [instance] = useState(factory);
  return instance;
};

export const downloadUrl = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
};

export const createObjectUrl = (data: Uint8Array, mimeType: string) => {
  // @ts-ignore
  return URL.createObjectURL(new Blob([data.buffer], { type: mimeType }));
};
