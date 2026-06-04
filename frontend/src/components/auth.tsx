import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: { email: string; password: string }) => Promise<void>;
  onRegister: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
};

type AuthMode = "login" | "register";
type LoginErrors = Partial<Record<"email" | "password", string>>;
type RegisterErrors = Partial<Record<"name" | "email" | "password", string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(email: string) {
  if (!EMAIL_REGEX.test(email.trim())) {
    return "Enter a valid email address.";
  }
}

function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
}

export function Auth({ isOpen, onClose, onLogin, onRegister }: AuthProps) {
  const [activeTab, setActiveTab] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});

  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServerError("");
      setLoginErrors({});
      setRegisterErrors({});
    }
  }, [isOpen]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: LoginErrors = {
      email: validateEmail(loginEmail),
      password: loginPassword ? undefined : "Password is required.",
    };

    setLoginErrors(errors);
    setServerError("");

    if (errors.email || errors.password) return;

    setIsSubmitting(true);

    try {
      await onLogin({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setLoginPassword("");
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const errors: RegisterErrors = {
      name:
        trimmedName.length < 2
          ? "Name must be at least 2 characters."
          : undefined,
      email: validateEmail(registerEmail),
      password: validatePassword(registerPassword),
    };

    setRegisterErrors(errors);
    setServerError("");

    if (errors.name || errors.email || errors.password) return;

    setIsSubmitting(true);

    try {
      await onRegister({
        name: trimmedName,
        email: registerEmail.trim(),
        password: registerPassword,
      });
      setRegisterPassword("");
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">Welcome</DialogTitle>
          <DialogDescription>
            Login to your account or create a new one.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as AuthMode);
            setServerError("");
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={submitLogin} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  aria-invalid={Boolean(loginErrors.email)}
                />
                {loginErrors.email ? (
                  <p className="text-xs text-destructive">
                    {loginErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  aria-invalid={Boolean(loginErrors.password)}
                />
                {loginErrors.password ? (
                  <p className="text-xs text-destructive">
                    {loginErrors.password}
                  </p>
                ) : null}
              </div>

              {serverError && activeTab === "login" ? (
                <p role="alert" className="text-sm text-destructive">
                  {serverError}
                </p>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={submitRegister} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  autoComplete="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(registerErrors.name)}
                />
                {registerErrors.name ? (
                  <p className="text-xs text-destructive">
                    {registerErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  aria-invalid={Boolean(registerErrors.email)}
                />
                {registerErrors.email ? (
                  <p className="text-xs text-destructive">
                    {registerErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  aria-invalid={Boolean(registerErrors.password)}
                />
                {registerErrors.password ? (
                  <p className="text-xs text-destructive">
                    {registerErrors.password}
                  </p>
                ) : null}
              </div>

              {serverError && activeTab === "register" ? (
                <p role="alert" className="text-sm text-destructive">
                  {serverError}
                </p>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
