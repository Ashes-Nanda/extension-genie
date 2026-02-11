import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";

const EXT_LANG_MAP: Record<string, string> = {
  ".js": "javascript",
  ".ts": "typescript",
  ".json": "json",
  ".html": "markup",
  ".css": "css",
  ".svg": "markup",
};

function getLang(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf("."));
  return EXT_LANG_MAP[ext] || "javascript";
}

interface CodeBlockProps {
  code: string;
  filename: string;
}

const CodeBlock = ({ code, filename }: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, filename]);

  const lang = getLang(filename);

  return (
    <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap !bg-transparent !m-0 !p-0">
      <code ref={codeRef} className={`language-${lang}`}>
        {code}
      </code>
    </pre>
  );
};

export default CodeBlock;
