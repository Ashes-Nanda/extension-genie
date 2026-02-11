export interface ExtensionFile {
  name: string;
  content: string;
}

export interface ExtensionMeta {
  type: "content_script" | "popup" | "background" | "hybrid" | "unknown";
  permissions: string[];
  warnings: string[];
}

export function parseExtensionFiles(raw: string): ExtensionFile[] {
  const files: ExtensionFile[] = [];
  // Match ```filename\n...content...\n```
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    files.push({ name: match[1], content: match[2].trim() });
  }
  return files;
}

export function analyzeManifest(files: ExtensionFile[]): ExtensionMeta {
  const manifestFile = files.find((f) => f.name === "manifest.json");
  if (!manifestFile) {
    return { type: "unknown", permissions: [], warnings: ["Missing manifest.json"] };
  }

  try {
    const manifest = JSON.parse(manifestFile.content);
    const permissions: string[] = manifest.permissions || [];
    const warnings: string[] = [];

    if (manifest.manifest_version !== 3) {
      warnings.push("Not Manifest V3 — must be version 3");
    }
    if (!manifest.name) warnings.push("Missing extension name");
    if (!manifest.version) warnings.push("Missing version");

    if (permissions.includes("<all_urls>")) {
      warnings.push("Uses <all_urls> — overly broad access");
    }
    if (permissions.includes("tabs") && permissions.includes("history")) {
      warnings.push("Sensitive: accesses tabs and browsing history");
    }

    let type: ExtensionMeta["type"] = "unknown";
    const hasContentScripts = !!manifest.content_scripts;
    const hasPopup = !!manifest.action?.default_popup;
    const hasBackground = !!manifest.background?.service_worker;

    if (hasContentScripts && hasPopup) type = "hybrid";
    else if (hasContentScripts) type = "content_script";
    else if (hasPopup) type = "popup";
    else if (hasBackground) type = "background";

    // Check for referenced files
    const referencedFiles: string[] = [];
    if (manifest.background?.service_worker) referencedFiles.push(manifest.background.service_worker);
    if (manifest.action?.default_popup) referencedFiles.push(manifest.action.default_popup);
    manifest.content_scripts?.forEach((cs: any) => {
      cs.js?.forEach((j: string) => referencedFiles.push(j));
      cs.css?.forEach((c: string) => referencedFiles.push(c));
    });

    const fileNames = files.map((f) => f.name);
    referencedFiles.forEach((rf) => {
      if (!fileNames.includes(rf)) {
        warnings.push(`Missing referenced file: ${rf}`);
      }
    });

    return { type, permissions, warnings };
  } catch {
    return { type: "unknown", permissions: [], warnings: ["Invalid manifest.json — cannot parse"] };
  }
}

export function getPermissionDescription(perm: string): string {
  const map: Record<string, string> = {
    activeTab: "Accesses the currently active tab when you click the extension",
    tabs: "Can see your open tabs and their URLs",
    storage: "Stores data locally in your browser",
    alarms: "Can schedule periodic tasks",
    notifications: "Can show desktop notifications",
    contextMenus: "Adds items to the right-click menu",
    cookies: "Can read and modify cookies",
    history: "Can access your browsing history",
    bookmarks: "Can access your bookmarks",
    downloads: "Can manage downloads",
    webRequest: "Can observe and modify network requests",
    "<all_urls>": "Can access all websites — very broad",
    scripting: "Can inject scripts into web pages",
    declarativeNetRequest: "Can block or modify network requests",
  };
  return map[perm] || perm;
}
