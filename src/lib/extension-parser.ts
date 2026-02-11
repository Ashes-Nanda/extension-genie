export interface ExtensionFile {
  name: string;
  content: string;
}

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  message: string;
}

export interface ExtensionMeta {
  type: "content_script" | "popup" | "background" | "hybrid" | "unknown";
  permissions: string[];
  warnings: string[];
  issues: ValidationIssue[];
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

// ── Security scanning ──

const DANGEROUS_PATTERNS: { pattern: RegExp; message: string; level: ValidationIssue["level"] }[] = [
  { pattern: /\beval\s*\(/, message: "Uses eval() — dynamic code execution is a security risk", level: "error" },
  { pattern: /new\s+Function\s*\(/, message: "Uses new Function() — dynamic code execution risk", level: "error" },
  { pattern: /document\.write\s*\(/, message: "Uses document.write() — potential injection vector", level: "warning" },
  { pattern: /innerHTML\s*=/, message: "Uses innerHTML — potential XSS vector, prefer textContent", level: "warning" },
  { pattern: /atob\s*\(/, message: "Decodes base64 data — review for obfuscated code", level: "warning" },
  { pattern: /<script\s+src\s*=\s*["']https?:\/\//, message: "Loads remote script — no external script loading allowed", level: "error" },
  { pattern: /chrome\.cookies/, message: "Accesses cookies — ensure this is necessary", level: "warning" },
  { pattern: /keydown|keyup|keypress/i, message: "Listens to keyboard events — verify not capturing credentials", level: "warning" },
  { pattern: /password|passwd|credential/i, message: "References password/credentials — review for data safety", level: "warning" },
  { pattern: /fetch\s*\(\s*["'][^"']*["']/, message: "Makes network requests — verify endpoint is expected", level: "info" },
];

function scanCodeSecurity(files: ExtensionFile[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const codeFiles = files.filter((f) => f.name.endsWith(".js") || f.name.endsWith(".ts") || f.name.endsWith(".html"));

  for (const file of codeFiles) {
    for (const { pattern, message, level } of DANGEROUS_PATTERNS) {
      if (pattern.test(file.content)) {
        issues.push({ level, message: `${file.name}: ${message}` });
      }
    }
  }
  return issues;
}

// ── Manifest analysis ──

export function analyzeManifest(files: ExtensionFile[]): ExtensionMeta {
  const issues: ValidationIssue[] = [];
  const manifestFile = files.find((f) => f.name === "manifest.json");

  if (!manifestFile) {
    return {
      type: "unknown",
      permissions: [],
      warnings: ["Missing manifest.json"],
      issues: [{ level: "error", message: "Missing manifest.json — extension cannot load" }],
    };
  }

  try {
    const manifest = JSON.parse(manifestFile.content);
    const permissions: string[] = manifest.permissions || [];
    const warnings: string[] = [];

    // ── Schema compliance ──
    if (manifest.manifest_version !== 3) {
      issues.push({ level: "error", message: "Not Manifest V3 — must be version 3" });
      warnings.push("Not Manifest V3 — must be version 3");
    }
    if (!manifest.name) {
      issues.push({ level: "error", message: "Missing extension name" });
      warnings.push("Missing extension name");
    }
    if (!manifest.version) {
      issues.push({ level: "error", message: "Missing version" });
      warnings.push("Missing version");
    }
    if (typeof manifest.description !== "string" || manifest.description.length === 0) {
      issues.push({ level: "warning", message: "Missing or empty description" });
    }

    // ── Icon reference check ──
    if (manifest.icons) {
      const iconValues = Object.values(manifest.icons) as string[];
      const fileNames = files.map((f) => f.name);
      for (const icon of iconValues) {
        if (!fileNames.includes(icon)) {
          issues.push({ level: "error", message: `Missing icon file: ${icon} — referenced in manifest "icons" but not generated` });
          warnings.push(`Missing icon file: ${icon}`);
        }
      }
    }

    // ── Permission discipline ──
    if (permissions.includes("<all_urls>")) {
      issues.push({ level: "error", message: "Uses <all_urls> — overly broad access" });
      warnings.push("Uses <all_urls> — overly broad access");
    }
    if (permissions.includes("tabs") && permissions.includes("history")) {
      issues.push({ level: "warning", message: "Sensitive: accesses tabs and browsing history" });
      warnings.push("Sensitive: accesses tabs and browsing history");
    }

    const hostPermissions: string[] = manifest.host_permissions || [];
    for (const hp of hostPermissions) {
      if (hp === "*://*/*" || hp === "<all_urls>") {
        issues.push({ level: "error", message: `host_permissions uses wildcard "${hp}" — too broad` });
        warnings.push(`host_permissions uses wildcard "${hp}"`);
      }
    }

    // ── Deprecated API check ──
    if (manifest.browser_action) {
      issues.push({ level: "error", message: "Uses deprecated browser_action — use action instead (MV3)" });
      warnings.push("Uses deprecated browser_action");
    }
    if (manifest.background?.scripts) {
      issues.push({ level: "error", message: "Uses deprecated background.scripts — use service_worker (MV3)" });
      warnings.push("Uses deprecated background.scripts");
    }
    if (manifest.background?.page) {
      issues.push({ level: "error", message: "Uses deprecated background.page — use service_worker (MV3)" });
      warnings.push("Uses deprecated background.page");
    }

    // ── Extension type detection ──
    let type: ExtensionMeta["type"] = "unknown";
    const hasContentScripts = !!manifest.content_scripts;
    const hasPopup = !!manifest.action?.default_popup;
    const hasBackground = !!manifest.background?.service_worker;

    if (hasContentScripts && hasPopup) type = "hybrid";
    else if (hasContentScripts) type = "content_script";
    else if (hasPopup) type = "popup";
    else if (hasBackground) type = "background";

    // ── Referenced file integrity ──
    const referencedFiles: string[] = [];
    if (manifest.background?.service_worker) referencedFiles.push(manifest.background.service_worker);
    if (manifest.action?.default_popup) referencedFiles.push(manifest.action.default_popup);
    if (manifest.options_page) referencedFiles.push(manifest.options_page);
    if (manifest.options_ui?.page) referencedFiles.push(manifest.options_ui.page);
    manifest.content_scripts?.forEach((cs: any) => {
      cs.js?.forEach((j: string) => referencedFiles.push(j));
      cs.css?.forEach((c: string) => referencedFiles.push(c));
    });
    manifest.web_accessible_resources?.forEach((war: any) => {
      if (war.resources) {
        war.resources.forEach((r: string) => referencedFiles.push(r));
      }
    });

    const fileNames = files.map((f) => f.name);
    referencedFiles.forEach((rf) => {
      if (!fileNames.includes(rf)) {
        issues.push({ level: "error", message: `Missing referenced file: ${rf}` });
        warnings.push(`Missing referenced file: ${rf}`);
      }
    });

    // ── Orphaned files (files not referenced anywhere) ──
    const allReferenced = new Set(["manifest.json", ...referencedFiles]);
    for (const f of files) {
      if (!allReferenced.has(f.name)) {
        issues.push({ level: "info", message: `Orphaned file: ${f.name} — not referenced in manifest` });
      }
    }

    // ── Permission validation ──
    const VALID_PERMISSIONS = new Set([
      "activeTab", "tabs", "storage", "alarms", "notifications", "contextMenus",
      "cookies", "history", "bookmarks", "downloads", "webRequest", "<all_urls>",
      "scripting", "declarativeNetRequest", "clipboardRead", "clipboardWrite",
      "idle", "management", "offscreen", "power", "sidePanel", "tts",
      "unlimitedStorage", "webNavigation", "declarativeNetRequestWithHostAccess",
      "declarativeNetRequestFeedback", "favicon", "fontSettings", "gcm",
      "geolocation", "identity", "nativeMessaging", "pageCapture", "privacy",
      "proxy", "search", "sessions", "tabCapture", "tabGroups", "topSites",
    ]);
    for (const p of permissions) {
      if (!VALID_PERMISSIONS.has(p)) {
        issues.push({ level: "warning", message: `Unknown permission: "${p}" — may not be valid` });
      }
    }

    // ── Code security scan ──
    const codeIssues = scanCodeSecurity(files);
    issues.push(...codeIssues);

    return { type, permissions, warnings, issues };
  } catch {
    return {
      type: "unknown",
      permissions: [],
      warnings: ["Invalid manifest.json — cannot parse"],
      issues: [{ level: "error", message: "Invalid manifest.json — JSON parse error" }],
    };
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
    clipboardRead: "Can read from clipboard",
    clipboardWrite: "Can write to clipboard",
    webNavigation: "Can observe navigation events",
    identity: "Can access user identity for OAuth",
    nativeMessaging: "Can communicate with native applications",
  };
  return map[perm] || perm;
}
