import JSZip from "jszip";
import type { ExtensionFile } from "./extension-parser";

export async function createExtensionZip(files: ExtensionFile[]): Promise<Blob> {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file.content);
  });
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
