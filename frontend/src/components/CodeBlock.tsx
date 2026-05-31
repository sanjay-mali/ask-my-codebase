import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(children);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="group rounded-xl overflow-hidden border bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-400">{language || "code"}</span>

        <button
          type="button"
          onClick={copyCode}
          className="text-zinc-400 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <pre className="overflow-auto p-4 text-white">
        <code>{children}</code>
      </pre>
    </div>
  );
}
