import { motion } from "framer-motion";
import { Bell, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TopbarProps = {
  title?: string;
  user?: { fullName?: string | null; username: string; avatarUrl?: string | null };
  onLogout?: () => void;
};

export function Topbar({ title = "Dashboard", user, onLogout }: TopbarProps) {
  const initials = user
    ? (user.fullName || user.username).slice(0, 2).toUpperCase()
    : "AD";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60"
    >
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors dashboard-notification-pulse"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || undefined} alt="" />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={onLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Language"
            >
              <Globe className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>Hindi</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
