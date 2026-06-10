import { useEffect, useState } from "react";
import { ChatPanel } from "./components/chat/ChatPanel";
import { Auth } from "./components/auth";
import { AppSidebar } from "./components/sidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Plus } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  getConversations,
  getConversationMessages,
  deleteConversation,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  type ConversationItem,
  type DbMessage,
} from "./services/api";
import "./index.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);

  const fetchConversations = async () => {
    try {
      const list = await getConversations();

      const sortedList = [...list].sort(
        (a, b) =>
          new Date(b.createAt).getTime() - new Date(a.createAt).getTime(),
      );
      setConversations(sortedList);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [user]);

  const handleLogin = async (input: LoginInput) => {
    const nextUser = await loginUser(input);
    setUser(nextUser);
  };

  const handleRegister = async (input: RegisterInput) => {
    const nextUser = await registerUser(input);
    setUser(nextUser);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const syncRouteWithState = async (userIdPresent: boolean) => {
    const path = window.location.pathname;
    const match = path.match(/^\/c\/([^\/]+)$/);
    if (match) {
      const id = match[1];
      if (id) {
        if (userIdPresent) {
          setActiveConversationId(id);
          try {
            const dbMsgs = await getConversationMessages(id);
            setMessages(dbMsgs);
          } catch (err) {
            console.error("Failed to load messages:", err);
            window.history.replaceState(null, "", "/");
            setActiveConversationId(null);
            setMessages([]);
          }
        } else {
          window.history.replaceState(null, "", "/");
          setActiveConversationId(null);
          setMessages([]);
          setIsAuthOpen(true);
        }
      } else {
        window.history.replaceState(null, "", "/");
        setActiveConversationId(null);
        setMessages([]);
      }
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (isCheckingSession) return;
    syncRouteWithState(Boolean(user));
  }, [isCheckingSession, user]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isCheckingSession) {
        syncRouteWithState(Boolean(user));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isCheckingSession, user]);

  const handleSelectConversation = async (id: string) => {
    window.history.pushState(null, "", `/c/${id}`);
    setActiveConversationId(id);
    try {
      const dbMsgs = await getConversationMessages(id);
      setMessages(dbMsgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleNewChat = () => {
    window.history.pushState(null, "", "/");
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleConversationCreated = (id: string) => {
    window.history.pushState(null, "", `/c/${id}`);
    setActiveConversationId(id);
    fetchConversations();
  };

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-background text-foreground">
        <AppSidebar
          user={user}
          isCheckingSession={isCheckingSession}
          conversations={conversations}
          activeId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
          onLoginClick={() => setIsAuthOpen(true)}
        />

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <main className="flex-1 overflow-hidden bg-background">
            <ChatPanel
              isAuthenticated={Boolean(user)}
              onAuthRequired={() => setIsAuthOpen(true)}
              conversationId={activeConversationId}
              onConversationCreated={handleConversationCreated}
              messages={messages}
              setMessages={setMessages}
              onNewChat={handleNewChat}
            />
          </main>
        </div>
      </div>

      <Auth
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </SidebarProvider>
  );
}

export default App;
