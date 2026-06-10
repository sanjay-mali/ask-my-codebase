import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "./CodeBlock";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="w-full max-w-none text-foreground leading-relaxed break-words text-[15px] space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code(props) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");

            if (!match) {
              return (
                <code
                  className="bg-muted/80 text-foreground font-mono text-[13px] px-1.5 py-0.5 rounded-md border border-border/40"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match[1]}>{children}</CodeBlock>;
          },
          p(props) {
            return (
              <p
                className="mb-4 leading-7 text-foreground/90 select-text last:mb-0"
                {...props}
              />
            );
          },
          h1(props) {
            return (
              <h1
                className="text-2xl font-bold mt-6 mb-3 text-foreground select-text first:mt-0"
                {...props}
              />
            );
          },
          h2(props) {
            return (
              <h2
                className="text-xl font-semibold mt-5 mb-2 text-foreground select-text first:mt-0"
                {...props}
              />
            );
          },
          h3(props) {
            return (
              <h3
                className="text-lg font-medium mt-4 mb-2 text-foreground select-text first:mt-0"
                {...props}
              />
            );
          },
          ul(props) {
            return (
              <ul
                className="list-disc pl-6 mb-4 space-y-1.5 select-text"
                {...props}
              />
            );
          },
          ol(props) {
            return (
              <ol
                className="list-decimal pl-6 mb-4 space-y-1.5 select-text"
                {...props}
              />
            );
          },
          li(props) {
            return <li className="mb-1 select-text last:mb-0" {...props} />;
          },
          blockquote(props) {
            return (
              <blockquote
                className="border-l-4 border-muted-foreground/30 bg-muted/30 pl-4 py-1.5 pr-2 italic my-4 rounded-r select-text"
                {...props}
              />
            );
          },
          a(props) {
            return (
              <a
                {...props}
                target="_blank"
                rel="noreferrer"
                className="text-foreground font-medium underline underline-offset-4 hover:text-foreground/85 transition-colors"
              />
            );
          },
          table(props) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-border">
                <table
                  className="min-w-full divide-y divide-border text-sm select-text"
                  {...props}
                />
              </div>
            );
          },
          thead(props) {
            return <thead className="bg-muted/50 select-text" {...props} />;
          },
          th(props) {
            return (
              <th
                className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border select-text"
                {...props}
              />
            );
          },
          td(props) {
            return (
              <td
                className="px-4 py-2 border-b border-border text-foreground/90 select-text"
                {...props}
              />
            );
          },
          hr(props) {
            return (
              <hr
                className="my-6 border-t border-border select-text"
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
