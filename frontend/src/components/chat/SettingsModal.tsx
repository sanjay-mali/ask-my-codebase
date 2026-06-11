import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ApiKeys = {
  openai: string;
  anthropic: string;
  gemini: string;
};

export const STORAGE_KEY_API_KEYS = "ask-finance-api-keys";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKeys>({
    openai: "",
    anthropic: "",
    gemini: "",
  });

  useEffect(() => {
    if (isOpen) {
      const stored = sessionStorage.getItem(STORAGE_KEY_API_KEYS);
      if (stored) {
        try {
          setKeys(JSON.parse(stored));
        } catch (e) {
          // ignore parsing error
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    sessionStorage.setItem(STORAGE_KEY_API_KEYS, JSON.stringify(keys));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Enter your API keys. They are stored securely in your browser's
            sessionStorage and sent to the server. They are automatically
            cleared when you close the tab.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="openai">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="openai"
                type="password"
                value={keys.openai}
                onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                placeholder="sk-..."
                className={keys.openai ? "pr-10" : ""}
              />
              {keys.openai && (
                <button
                  type="button"
                  onClick={() => setKeys({ ...keys, openai: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear API Key"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anthropic">Anthropic API Key</Label>
            <div className="relative">
              <Input
                id="anthropic"
                type="password"
                value={keys.anthropic}
                onChange={(e) =>
                  setKeys({ ...keys, anthropic: e.target.value })
                }
                placeholder="sk-ant-..."
                className={keys.anthropic ? "pr-10" : ""}
              />
              {keys.anthropic && (
                <button
                  type="button"
                  onClick={() => setKeys({ ...keys, anthropic: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear API Key"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gemini">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="gemini"
                type="password"
                value={keys.gemini}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                placeholder="AIza..."
                className={keys.gemini ? "pr-10" : ""}
              />
              {keys.gemini && (
                <button
                  type="button"
                  onClick={() => setKeys({ ...keys, gemini: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear API Key"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
