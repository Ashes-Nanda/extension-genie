import { describe, it, expect } from "vitest";
import { parseExtensionFiles, analyzeManifest, type ExtensionFile } from "../extension-parser";

// ── Helper ──
function makeFiles(manifest: object, extras: ExtensionFile[] = []): ExtensionFile[] {
  return [
    { name: "manifest.json", content: JSON.stringify(manifest, null, 2) },
    ...extras,
  ];
}

const VALID_BASE = {
  manifest_version: 3,
  name: "Test Extension",
  version: "1.0.0",
  description: "A test extension",
};

// ═══════════════════════════════════════════
// 1. File Parsing
// ═══════════════════════════════════════════

describe("parseExtensionFiles", () => {
  it("extracts files from fenced code blocks", () => {
    const raw = '```manifest.json\n{"key":"val"}\n```\n\n```content.js\nconsole.log("hi");\n```';
    const files = parseExtensionFiles(raw);
    expect(files).toHaveLength(2);
    expect(files[0].name).toBe("manifest.json");
    expect(files[1].name).toBe("content.js");
  });

  it("returns empty for no code blocks", () => {
    expect(parseExtensionFiles("Just some text")).toHaveLength(0);
  });

  it("handles blocks with special characters", () => {
    const raw = '```popup.html\n<div class="test">&amp;</div>\n```';
    const files = parseExtensionFiles(raw);
    expect(files[0].content).toContain('class="test"');
  });
});

// ═══════════════════════════════════════════
// 2. Manifest Schema Compliance
// ═══════════════════════════════════════════

describe("analyzeManifest – schema compliance", () => {
  it("passes valid MV3 manifest", () => {
    const meta = analyzeManifest(makeFiles(VALID_BASE));
    const errors = meta.issues.filter((i) => i.level === "error");
    expect(errors).toHaveLength(0);
  });

  it("flags missing manifest.json", () => {
    const meta = analyzeManifest([{ name: "content.js", content: "// code" }]);
    expect(meta.issues.some((i) => i.message.includes("Missing manifest.json"))).toBe(true);
  });

  it("flags non-MV3", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, manifest_version: 2 }));
    expect(meta.issues.some((i) => i.message.includes("Manifest V3"))).toBe(true);
  });

  it("flags missing name", () => {
    const { name: _, ...noName } = VALID_BASE;
    const meta = analyzeManifest(makeFiles({ ...noName, manifest_version: 3 }));
    expect(meta.issues.some((i) => i.message.includes("Missing extension name"))).toBe(true);
  });

  it("flags missing version", () => {
    const { version: _, ...noVer } = VALID_BASE;
    const meta = analyzeManifest(makeFiles({ ...noVer, manifest_version: 3 }));
    expect(meta.issues.some((i) => i.message.includes("Missing version"))).toBe(true);
  });

  it("flags invalid JSON", () => {
    const meta = analyzeManifest([{ name: "manifest.json", content: "NOT JSON {{{" }]);
    expect(meta.issues.some((i) => i.message.includes("JSON parse error"))).toBe(true);
  });

  it("flags deprecated browser_action", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, browser_action: {} }));
    expect(meta.issues.some((i) => i.message.includes("deprecated browser_action"))).toBe(true);
  });

  it("flags deprecated background.scripts", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, background: { scripts: ["bg.js"] } }));
    expect(meta.issues.some((i) => i.message.includes("deprecated background.scripts"))).toBe(true);
  });
});

// ═══════════════════════════════════════════
// 3. Permission Discipline
// ═══════════════════════════════════════════

describe("analyzeManifest – permission discipline", () => {
  it("flags <all_urls>", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, permissions: ["<all_urls>"] }));
    expect(meta.issues.some((i) => i.message.includes("<all_urls>"))).toBe(true);
  });

  it("flags wildcard host_permissions", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, host_permissions: ["*://*/*"] }));
    expect(meta.issues.some((i) => i.message.includes("wildcard"))).toBe(true);
  });

  it("flags unknown permissions", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, permissions: ["madeUpPerm"] }));
    expect(meta.issues.some((i) => i.message.includes("Unknown permission"))).toBe(true);
  });

  it("accepts valid permissions", () => {
    const meta = analyzeManifest(makeFiles({ ...VALID_BASE, permissions: ["activeTab", "storage"] }));
    const unknowns = meta.issues.filter((i) => i.message.includes("Unknown permission"));
    expect(unknowns).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════
// 4. File Integrity
// ═══════════════════════════════════════════

describe("analyzeManifest – file integrity", () => {
  it("flags missing referenced content script", () => {
    const manifest = {
      ...VALID_BASE,
      content_scripts: [{ js: ["content.js"], matches: ["*://*.example.com/*"] }],
    };
    const meta = analyzeManifest(makeFiles(manifest)); // no content.js file
    expect(meta.issues.some((i) => i.message.includes("Missing referenced file: content.js"))).toBe(true);
  });

  it("passes when referenced files exist", () => {
    const manifest = {
      ...VALID_BASE,
      content_scripts: [{ js: ["content.js"], matches: ["*://*.example.com/*"] }],
    };
    const meta = analyzeManifest(makeFiles(manifest, [{ name: "content.js", content: "// ok" }]));
    const missing = meta.issues.filter((i) => i.message.includes("Missing referenced file"));
    expect(missing).toHaveLength(0);
  });

  it("flags missing popup file", () => {
    const manifest = { ...VALID_BASE, action: { default_popup: "popup.html" } };
    const meta = analyzeManifest(makeFiles(manifest));
    expect(meta.issues.some((i) => i.message.includes("Missing referenced file: popup.html"))).toBe(true);
  });

  it("flags missing icon file", () => {
    const manifest = { ...VALID_BASE, icons: { "16": "icon16.png" } };
    const meta = analyzeManifest(makeFiles(manifest));
    expect(meta.issues.some((i) => i.message.includes("Missing icon file: icon16.png"))).toBe(true);
  });

  it("detects orphaned files", () => {
    const meta = analyzeManifest(makeFiles(VALID_BASE, [{ name: "unused.js", content: "// orphan" }]));
    expect(meta.issues.some((i) => i.message.includes("Orphaned file: unused.js"))).toBe(true);
  });
});

// ═══════════════════════════════════════════
// 5. Extension Type Detection
// ═══════════════════════════════════════════

describe("analyzeManifest – type detection", () => {
  it("detects popup type", () => {
    const manifest = { ...VALID_BASE, action: { default_popup: "popup.html" } };
    const meta = analyzeManifest(makeFiles(manifest, [{ name: "popup.html", content: "<html></html>" }]));
    expect(meta.type).toBe("popup");
  });

  it("detects content_script type", () => {
    const manifest = {
      ...VALID_BASE,
      content_scripts: [{ js: ["content.js"], matches: ["*://*.example.com/*"] }],
    };
    const meta = analyzeManifest(makeFiles(manifest, [{ name: "content.js", content: "// ok" }]));
    expect(meta.type).toBe("content_script");
  });

  it("detects background type", () => {
    const manifest = { ...VALID_BASE, background: { service_worker: "bg.js" } };
    const meta = analyzeManifest(makeFiles(manifest, [{ name: "bg.js", content: "// ok" }]));
    expect(meta.type).toBe("background");
  });

  it("detects hybrid type", () => {
    const manifest = {
      ...VALID_BASE,
      action: { default_popup: "popup.html" },
      content_scripts: [{ js: ["content.js"], matches: ["*://*.example.com/*"] }],
    };
    const meta = analyzeManifest(makeFiles(manifest, [
      { name: "popup.html", content: "<html></html>" },
      { name: "content.js", content: "// ok" },
    ]));
    expect(meta.type).toBe("hybrid");
  });
});

// ═══════════════════════════════════════════
// 6. Code Security Scanning
// ═══════════════════════════════════════════

describe("analyzeManifest – code security", () => {
  it("flags eval()", () => {
    const meta = analyzeManifest(makeFiles(VALID_BASE, [{ name: "content.js", content: 'eval("alert(1)")' }]));
    expect(meta.issues.some((i) => i.message.includes("eval()"))).toBe(true);
  });

  it("flags new Function()", () => {
    const meta = analyzeManifest(makeFiles(VALID_BASE, [{ name: "bg.js", content: 'new Function("return 1")' }]));
    expect(meta.issues.some((i) => i.message.includes("new Function()"))).toBe(true);
  });

  it("flags remote script loading in HTML", () => {
    const meta = analyzeManifest(makeFiles(VALID_BASE, [{ name: "popup.html", content: '<script src="https://evil.com/payload.js"></script>' }]));
    expect(meta.issues.some((i) => i.message.includes("remote script"))).toBe(true);
  });

  it("flags innerHTML usage", () => {
    const meta = analyzeManifest(makeFiles(VALID_BASE, [{ name: "content.js", content: 'el.innerHTML = userInput;' }]));
    expect(meta.issues.some((i) => i.message.includes("innerHTML"))).toBe(true);
  });

  it("does not flag clean code", () => {
    const cleanCode = `
      const el = document.createElement("div");
      el.textContent = "Hello";
      document.body.appendChild(el);
    `;
    const meta = analyzeManifest(makeFiles(VALID_BASE, [{ name: "content.js", content: cleanCode }]));
    const securityErrors = meta.issues.filter((i) => i.level === "error" && !i.message.includes("Orphaned"));
    expect(securityErrors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════
// 7. Golden Master: 10 Canonical Prompts
// ═══════════════════════════════════════════

describe("Golden Master – canonical extension structures", () => {
  // These test the EXPECTED output structure. The AI should generate
  // extensions matching these patterns. We validate the parser + analyzer
  // would accept well-formed output for each canonical case.

  const canonicals: { name: string; manifest: object; files: ExtensionFile[]; expectedType: string; expectedPerms: string[] }[] = [
    {
      name: "1. Dark mode toggle",
      manifest: { ...VALID_BASE, name: "Dark Mode", action: { default_popup: "popup.html" }, permissions: ["activeTab", "scripting"] },
      files: [{ name: "popup.html", content: "<html><body><button>Toggle</button></body></html>" }, { name: "popup.js", content: "// toggle logic" }],
      expectedType: "popup",
      expectedPerms: ["activeTab", "scripting"],
    },
    {
      name: "2. Price tracker (domain-specific)",
      manifest: { ...VALID_BASE, name: "Price Tracker", content_scripts: [{ js: ["content.js"], matches: ["*://*.amazon.com/*"] }], permissions: ["storage"] },
      files: [{ name: "content.js", content: "// price logic" }],
      expectedType: "content_script",
      expectedPerms: ["storage"],
    },
    {
      name: "3. Popup counter",
      manifest: { ...VALID_BASE, name: "Counter", action: { default_popup: "popup.html" }, permissions: ["storage"] },
      files: [{ name: "popup.html", content: "<html></html>" }, { name: "popup.js", content: "// counter" }],
      expectedType: "popup",
      expectedPerms: ["storage"],
    },
    {
      name: "4. YouTube button injector",
      manifest: { ...VALID_BASE, name: "YT Button", content_scripts: [{ js: ["content.js"], matches: ["*://*.youtube.com/*"] }] },
      files: [{ name: "content.js", content: "// inject button" }],
      expectedType: "content_script",
      expectedPerms: [],
    },
    {
      name: "5. Clipboard helper",
      manifest: { ...VALID_BASE, name: "Clip Helper", action: { default_popup: "popup.html" }, permissions: ["clipboardWrite", "activeTab"] },
      files: [{ name: "popup.html", content: "<html></html>" }],
      expectedType: "popup",
      expectedPerms: ["clipboardWrite", "activeTab"],
    },
    {
      name: "6. Tab manager",
      manifest: { ...VALID_BASE, name: "Tab Manager", action: { default_popup: "popup.html" }, permissions: ["tabs"] },
      files: [{ name: "popup.html", content: "<html></html>" }],
      expectedType: "popup",
      expectedPerms: ["tabs"],
    },
    {
      name: "7. Notification scheduler (background)",
      manifest: { ...VALID_BASE, name: "Notifier", background: { service_worker: "bg.js" }, permissions: ["alarms", "notifications"] },
      files: [{ name: "bg.js", content: "// alarm logic" }],
      expectedType: "background",
      expectedPerms: ["alarms", "notifications"],
    },
    {
      name: "8. LinkedIn content script",
      manifest: { ...VALID_BASE, name: "LI Styler", content_scripts: [{ js: ["content.js"], css: ["style.css"], matches: ["*://*.linkedin.com/*"] }] },
      files: [{ name: "content.js", content: "// style" }, { name: "style.css", content: "body{}" }],
      expectedType: "content_script",
      expectedPerms: [],
    },
    {
      name: "9. Hybrid: popup + content script",
      manifest: {
        ...VALID_BASE, name: "Hybrid",
        action: { default_popup: "popup.html" },
        content_scripts: [{ js: ["content.js"], matches: ["*://*.example.com/*"] }],
        permissions: ["storage", "activeTab"],
      },
      files: [{ name: "popup.html", content: "<html></html>" }, { name: "content.js", content: "// cs" }],
      expectedType: "hybrid",
      expectedPerms: ["storage", "activeTab"],
    },
    {
      name: "10. Context menu action",
      manifest: { ...VALID_BASE, name: "Context Menu", background: { service_worker: "bg.js" }, permissions: ["contextMenus"] },
      files: [{ name: "bg.js", content: "// context menu" }],
      expectedType: "background",
      expectedPerms: ["contextMenus"],
    },
  ];

  for (const tc of canonicals) {
    it(`${tc.name} – validates cleanly`, () => {
      const allFiles = makeFiles(tc.manifest, tc.files);
      const meta = analyzeManifest(allFiles);
      const errors = meta.issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
      expect(meta.type).toBe(tc.expectedType);
      expect(meta.permissions).toEqual(tc.expectedPerms);
    });
  }
});
