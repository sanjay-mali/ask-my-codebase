import { useEffect, useState } from "react";
import { ChatPanel } from "./components/chat/ChatPanel";
import { Auth } from "./components/auth";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from "./services/api";
import { Button } from "./components/ui/button";
import "./index.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 shrink-0 border-b">
        <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight">
            Ask Your Codebase
          </h1>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-muted-foreground max-w-48 truncate">
                  {user.name}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsAuthOpen(true)}
                disabled={isCheckingSession}
              >
                {isCheckingSession ? "Checking..." : "Login"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ChatPanel
          isAuthenticated={Boolean(user)}
          onAuthRequired={() => setIsAuthOpen(true)}
        />
      </main>

      <Auth
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}

export default App;
