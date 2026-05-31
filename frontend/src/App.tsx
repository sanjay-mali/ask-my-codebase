import { ChatPanel } from "./components/chat/ChatPanel";
import "./index.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

export function App() {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 shrink-0 border-b flex items-center justify-center">
        <h1 className="text-xl font-bold tracking-tight">Ask Your Codebase</h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <ChatPanel />
      </main>
    </div>
  );
}

export default App;
