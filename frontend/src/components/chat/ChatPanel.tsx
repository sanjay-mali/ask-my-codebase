import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askCodebase } from "@/services/api";
import type { ChatMessage } from "@/types/chat";
import { Bot, Code2, Send, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type ChatPanelProps = {
  isAuthenticated: boolean;
  onAuthRequired: () => void;
};

export function ChatPanel({ isAuthenticated, onAuthRequired }: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chat?.answer, isLoading]);

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const currentQuestion = question.trim();

    if (!currentQuestion) return;

    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    setQuestion("");
    setChat({
      question: currentQuestion,
      answer: "",
    });
    setIsLoading(true);

    try {
      await askCodebase({
        question: currentQuestion,
        onChunk(answer) {
          setIsLoading(false);
          setChat({
            question: currentQuestion,
            answer,
          });
        },
      });
    } catch (error) {
      setChat({
        question: currentQuestion,
        answer: error instanceof Error ? error.message : "Something went wrong",
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {!chat ? (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Bot className="w-12 h-12 text-primary" />
              </div>

              <h2 className="text-2xl font-semibold">
                How can I help you today?
              </h2>

              <p className="text-muted-foreground mt-2">
                Ask any question about your codebase
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full border bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>

                <div className="flex-1">
                  <div className="font-medium mb-2">You</div>

                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {chat.question}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full border bg-primary/10 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-2">Ask your codebase AI</div>

                  {isLoading && !chat.answer ? (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.4s]" />
                    </div>
                  ) : chat.error ? (
                    <div className="text-destructive">{chat.answer}</div>
                  ) : (
                    <MarkdownRenderer content={chat.answer} />
                  )}
                </div>
              </div>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto p-4">
          <form
            onSubmit={submitQuestion}
            className="flex items-center gap-2 border rounded-xl p-2 bg-card shadow-sm"
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your codebase..."
              disabled={isLoading}
              className="border-0 shadow-none focus-visible:ring-0"
            />

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !question.trim()}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
