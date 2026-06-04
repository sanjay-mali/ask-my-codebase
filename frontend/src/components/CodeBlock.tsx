import { Check, Copy } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    return extractText(
      (node as { props?: { children?: ReactNode } }).props?.children,
    );
  }

  return "";
}

type CodeBlockProps = {
  children: ReactNode;
  language?: string;
};

export function CodeBlock({ children, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const codeText = useMemo(() => extractText(children), [children]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="text-xs text-zinc-400">{language || "code"}</span>

        <button
          type="button"
          onClick={copyCode}
          className="text-zinc-400 transition hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-sm text-white">
        <code>{children}</code>
      </pre>
    </div>
  );
}
