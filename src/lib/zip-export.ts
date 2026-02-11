import JSZip from "jszip";
import type { ExtensionFile } from "./extension-parser";
import type { GeneratedIcons } from "./icon-generator";

export async function createExtensionZip(files: ExtensionFile[]): Promise<Blob> {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file.content);
  });
  return zip.generateAsync({ type: "blob" });
}

export async function createExtensionZipWithIcons(
  files: ExtensionFile[],
  icons: GeneratedIcons
): Promise<Blob> {
  const zip = new JSZip();

  files.forEach((file) => {
    if (file.name === "manifest.json") {
      try {
        const manifest = JSON.parse(file.content);
        manifest.icons = {
          "16": "icon16.png",
          "48": "icon48.png",
          "128": "icon128.png",
        };
        zip.file(file.name, JSON.stringify(manifest, null, 2));
      } catch {
        zip.file(file.name, file.content);
      }
    } else {
      zip.file(file.name, file.content);
    }
  });

  zip.file("icon16.png", icons["icon16.png"]);
  zip.file("icon48.png", icons["icon48.png"]);
  zip.file("icon128.png", icons["icon128.png"]);

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
