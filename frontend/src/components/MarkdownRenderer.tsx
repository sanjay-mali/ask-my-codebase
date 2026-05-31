import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "./CodeBlock";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div
      className="
        prose
        prose-neutral
        dark:prose-invert
        max-w-none

        prose-headings:font-semibold
        prose-headings:scroll-mt-20

        prose-p:text-foreground
        prose-p:leading-7

        prose-pre:bg-zinc-950
        prose-pre:border
        prose-pre:rounded-xl

        prose-code:text-primary
        prose-code:before:content-none
        prose-code:after:content-none

        prose-blockquote:border-l-primary

        prose-table:block
        prose-table:overflow-x-auto

        prose-img:rounded-xl
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code(props) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");

            if (!match) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded" {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match[1]}>{String(children)}</CodeBlock>
            );
          },
          a(props) {
            return (
              <a
                {...props}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              />
            );
          },
          table(props) {
            return (
              <div className="overflow-x-auto">
                <table {...props} />
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
