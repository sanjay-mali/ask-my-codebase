import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { askFinanceAI, type DbMessage } from "@/services/api";
import {
  ArrowUp,
  BookOpen,
  Briefcase,
  ChevronDown,
  Coins,
  Globe,
  Paperclip,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

type ChatPanelProps = {
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  messages: DbMessage[];
  setMessages: React.Dispatch<React.SetStateAction<DbMessage[]>>;
  onNewChat: () => void;
};

const SUGGESTIONS = [
  {
    title: "Analyze market trends",
    description:
      "Get insights on current trends, sector moves, and indicators.",
    prompt:
      "Analyze current market trends in the technology sector vs the energy sector.",
    icon: TrendingUp,
  },
  {
    title: "De-jargon financial terms",
    description: "Understand complex corporate finance metrics easily.",
    prompt:
      "Explain the difference between EBITDA, operating cash flow, and free cash flow.",
    icon: Coins,
  },
  {
    title: "Optimize portfolio strategy",
    description:
      "Learn core principles of asset allocation and diversification.",
    prompt:
      "What are the core strategies for building a growth-focused, diversified investment portfolio?",
    icon: Briefcase,
  },
  {
    title: "Evaluate financial health",
    description: "Analyze company balance sheets, ratios, and risk factors.",
    prompt:
      "How do I check a company's liquidity and debt safety using its balance sheet?",
    icon: BookOpen,
  },
];

export function ChatPanel({
  isAuthenticated,
  onAuthRequired,
  conversationId,
  onConversationCreated,
  messages,
  setMessages,
}: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState("gemini-3.5-flash");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isResearchActive, setIsResearchActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      if (!question) {
        textareaRef.current.style.height = "40px";
      } else {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200,
        )}px`;
      }
    }
  }, [question]);

  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      textareaRef.current?.focus();
    }
  }, [messages.length, isLoading]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setAttachedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStopStreaming = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const sendPrompt = async (promptText: string) => {
    const currentQuestion = promptText.trim();
    if (!currentQuestion) return;

    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    setQuestion("");
    setAttachedFiles([]);

    const userMessage: DbMessage = {
      id: `user-${Date.now()}`,
      conversationId: conversationId || "temp-conv",
      role: "user",
      content: currentQuestion,
      createAt: new Date().toISOString(),
    };

    const assistantMessage: DbMessage = {
      id: `assistant-${Date.now()}`,
      conversationId: conversationId || "temp-conv",
      role: "assistant",
      content: "",
      createAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      await askFinanceAI({
        question: currentQuestion,
        conversationId: conversationId || undefined,
        signal: controller.signal,
        onConversationId(newId) {
          onConversationCreated(newId);
        },
        onChunk(answer) {
          setIsLoading(false);
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              lastMsg.content = answer;
            }
            return updated;
          });
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            if (!lastMsg.content) {
              lastMsg.content = "_Generation stopped._";
            }
          }
          return updated;
        });
        return;
      }

      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content =
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isLoading && question.trim()) {
      sendPrompt(question);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden select-none">
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/95 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-1.5">
          <SidebarTrigger className="size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/65 transition-colors cursor-pointer" />
          <div className="h-4 w-px bg-border mx-1 shrink-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="gap-1 font-semibold text-muted-foreground hover:text-foreground text-xs hover:bg-muted/60 rounded-lg h-9 px-2.5 transition-colors shrink-0 cursor-pointer"
              >
                <span>
                  {activeModel === "gemini-3.5-flash"
                    ? "Gemini 3.5"
                    : "Gemini 3.1"}
                </span>
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-48 bg-popover border border-border text-popover-foreground shadow-md"
            >
              <DropdownMenuItem
                onClick={() => setActiveModel("gemini-3.5-flash")}
                className="cursor-pointer"
              >
                Gemini 3.5 Flash
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveModel("gemini-3.1-pro")}
                className="cursor-pointer"
              >
                Gemini 3.1 Pro (High)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full min-h-0 py-4 flex flex-col">
        <div className="max-w-4xl mx-auto px-4 w-full flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-4 animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="p-3.5 rounded-2xl bg-secondary mb-4 border border-border/40 shadow-xs">
                  <Sparkles className="w-8 h-8 text-foreground/85 animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground select-text">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground text-sm mt-2 max-w-md leading-relaxed select-text">
                  Ask questions, analyze financial statements, explain market
                  concepts, or explore strategies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuestion(s.prompt);
                        textareaRef.current?.focus();
                      }}
                      className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/40 text-left transition-all duration-200 hover:border-border cursor-pointer group hover:shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-secondary/80 text-muted-foreground group-hover:text-foreground group-hover:bg-secondary transition-colors mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-[13px] text-foreground">
                            {s.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-normal">
                            {s.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4 select-text">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || index}
                    className={`flex gap-4 ${
                      isUser ? "justify-end" : "justify-start"
                    } py-1.5`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <Sparkles className="w-4.5 h-4.5 text-foreground/80" />
                      </div>
                    )}

                    <div
                      className={`${
                        isUser
                          ? "max-w-[75%] px-4.5 py-3 rounded-2xl bg-secondary text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs border border-border/30"
                          : "flex-1 min-w-0 text-foreground"
                      }`}
                    >
                      {isUser ? (
                        msg.content
                      ) : isLoading && !msg.content ? (
                        <div className="flex items-center gap-1.5 py-3.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.4s]" />
                        </div>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-t from-background via-background to-transparent pb-4 pt-1 px-4 shrink-0 border-t border-border/10">
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-border bg-card rounded-xl shadow-xs">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-muted/60 text-xs px-2.5 py-1.5 rounded-lg border max-w-full"
                >
                  <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col border border-border rounded-3xl p-2 bg-card shadow-xs focus-within:ring-1 focus-within:ring-foreground/20 focus-within:border-foreground/30 transition-all duration-150"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about financial markets, portfolios, or companies..."
              disabled={isLoading}
              style={{ height: question ? undefined : "40px" }}
              className="w-full resize-none bg-transparent outline-hidden py-2 px-3 border-0 focus:ring-0 placeholder:text-muted-foreground text-sm min-h-[40px] max-h-[160px] leading-relaxed text-foreground select-text"
            />

            <div className="flex items-center justify-between px-2 pt-1.5 border-t border-border/40 mt-1">
              <div className="flex items-center gap-1 flex-wrap">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={triggerUpload}
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  title="Upload files"
                >
                  <Paperclip className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchActive(!isSearchActive)}
                  className={`size-8 rounded-full transition-all duration-150 cursor-pointer ${
                    isSearchActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="Web Search"
                >
                  <Globe className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsResearchActive(!isResearchActive)}
                  className={`size-8 rounded-full transition-all duration-150 cursor-pointer ${
                    isResearchActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="Deep Research"
                >
                  <Sparkles className="size-4" />
                </Button>
              </div>

              {isLoading || abortController ? (
                <Button
                  type="button"
                  onClick={handleStopStreaming}
                  size="icon"
                  className="size-8 rounded-full bg-foreground hover:bg-foreground/90 text-background shrink-0 flex items-center justify-center cursor-pointer"
                  title="Stop generating"
                >
                  <div className="size-2.5 bg-background rounded-xs" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !question.trim()}
                  className="size-8 rounded-full bg-foreground hover:bg-foreground/90 text-background shrink-0 disabled:bg-muted/50 disabled:text-muted-foreground/45 flex items-center justify-center cursor-pointer"
                >
                  <ArrowUp className="w-4.5 h-4.5" />
                </Button>
              )}
            </div>
          </form>

          <p className="text-[10px] text-center text-muted-foreground mt-3 select-text">
            Finance AI can make mistakes. Verify critical details and consult a
            certified financial advisor before investing.
          </p>
        </div>
      </div>
    </div>
  );
}
