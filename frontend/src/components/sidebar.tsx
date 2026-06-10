import {
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  User,
  User2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { type AuthUser, type ConversationItem } from "@/services/api";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser | null;
  isCheckingSession: boolean;
  conversations: ConversationItem[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
};

export function AppSidebar({
  user,
  isCheckingSession,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onLogout,
  onLoginClick,
  ...props
}: AppSidebarProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const groupConversations = (items: ConversationItem[]) => {
    const groups: Record<
      "Today" | "Yesterday" | "Previous 7 Days" | "Older",
      ConversationItem[]
    > = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    items.forEach((item) => {
      if (!item.createAt) return;
      const itemDate = new Date(item.createAt);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        groups.Today.push(item);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(item);
      } else if (itemDate.getTime() >= sevenDaysAgo.getTime()) {
        groups["Previous 7 Days"].push(item);
      } else {
        groups.Older.push(item);
      }
    });

    return groups;
  };

  const grouped = groupConversations(conversations);

  return (
    <Sidebar
      className="border-sidebar-border bg-sidebar text-sidebar-foreground select-none"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="relative flex flex-row items-center justify-between mt-3 px-3 pb-2">
        <div className="flex items-center gap-2 font-semibold text-sidebar-foreground animate-in fade-in duration-300">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0 border border-sidebar-border shadow-xs">
            <Sparkles className="size-4.5" />
          </div>
          <span className="truncate text-sm tracking-wide group-data-[state=collapsed]:hidden">
            Ask Your Codebase
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-2">
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onNewChat}
                tooltip="New Chat"
                className="w-full flex items-center justify-start gap-2.5 text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150 py-5 px-3 rounded-lg border border-sidebar-border/65 font-medium group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2 group-data-[state=collapsed]:h-10 cursor-pointer"
              >
                <Plus className="size-4.5 shrink-0 text-sidebar-foreground/85" />
                <span className="group-data-[state=collapsed]:hidden text-sm">
                  New Chat
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {user && conversations.length > 0 && (
          <SidebarGroup className="group-data-[state=collapsed]:hidden mt-4 p-0">
            <SidebarGroupContent>
              {Object.entries(grouped).map(([groupName, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={groupName} className="mb-5">
                    <div className="px-2 py-1 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider select-none">
                      {groupName}
                    </div>
                    <SidebarMenu className="mt-1 gap-0.5">
                      {items.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            isActive={activeId === chat.id}
                            onClick={() => onSelectConversation(chat.id)}
                            className={`group/item pr-8 relative w-full text-left rounded-lg py-4.5 transition-all duration-150 cursor-pointer ${
                              activeId === chat.id
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/85 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                            }`}
                          >
                            <span className="truncate block pr-2 text-[13px] leading-tight">
                              {chat.title || "Untitled Chat"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setDeleteTargetId(chat.id);
                              }}
                              className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-destructive transition-all duration-150 cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full flex items-center gap-2.5 py-6 px-3 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2 group-data-[state=collapsed]:h-10 hover:bg-sidebar-accent/50 rounded-lg text-sidebar-foreground transition-colors">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold shrink-0 shadow-xs border border-sidebar-border">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col min-w-0 text-left group-data-[state=collapsed]:hidden">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {user.name}
                      </span>
                      <span className="text-xs text-sidebar-foreground/50 truncate leading-none mt-0.5">
                        {user.email}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 ml-2 bg-popover border border-border text-popover-foreground shadow-lg"
                >
                  <DropdownMenuItem className="hover:bg-accent focus:bg-accent focus:text-accent-foreground cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-accent focus:bg-accent focus:text-accent-foreground cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <div className="flex flex-col gap-1 px-1">
            <div className="px-2 py-2 mb-2 text-xs text-sidebar-foreground/50 group-data-[state=collapsed]:hidden leading-relaxed">
              {isCheckingSession ? "Loading..." : "Log in to save history"}
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLoginClick}
                  tooltip="Login / Register"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <User2 className="size-4 shrink-0 text-sidebar-foreground/75" />
                  <span className="group-data-[state=collapsed]:hidden text-sm">
                    Login / Register
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarFooter>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversation and all associated
              messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="cursor-pointer"
              onClick={(e) => {
                if (deleteTargetId) {
                  onDeleteConversation(deleteTargetId, e);
                  setDeleteTargetId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
