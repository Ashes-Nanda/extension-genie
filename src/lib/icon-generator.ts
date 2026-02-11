import { supabase } from "@/integrations/supabase/client";

export function generateIconPrompt(manifestContent: string): string {
  try {
    const manifest = JSON.parse(manifestContent);
    const name = manifest.name || "Chrome Extension";
    const description = manifest.description || "";
    return `Generate a single app icon for a Chrome browser extension called "${name}". ${description ? `The extension: ${description}. ` : ""}The icon should be flat design, solid vibrant background color, simple centered symbol, no text, no letters, square aspect ratio, suitable for 128x128 pixels. Clean, modern, professional.`;
  } catch {
    return "Generate a simple, clean app icon for a Chrome browser extension. Flat design, solid background, simple symbol, no text, square, suitable for 128x128.";
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resizeToBlob(img: HTMLImageElement, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

export interface GeneratedIcons {
  "icon16.png": Blob;
  "icon48.png": Blob;
  "icon128.png": Blob;
}

export async function generateIcons(manifestContent: string): Promise<GeneratedIcons> {
  const prompt = generateIconPrompt(manifestContent);

  const { data, error } = await supabase.functions.invoke("generate-icon", {
    body: { prompt },
  });

  if (error || !data?.imageBase64) {
    throw new Error(error?.message || "Failed to generate icon");
  }

  const img = await loadImage(data.imageBase64);

  const [icon16, icon48, icon128] = await Promise.all([
    resizeToBlob(img, 16),
    resizeToBlob(img, 48),
    resizeToBlob(img, 128),
  ]);

  return {
    "icon16.png": icon16,
    "icon48.png": icon48,
    "icon128.png": icon128,
  };
}
