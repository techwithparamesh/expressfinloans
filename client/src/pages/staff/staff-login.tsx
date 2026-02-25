import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock } from "lucide-react";
import { login } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const p = (base: string, path: string) => (base ? `${base}${path}` : path || "/");

export default function StaffLogin({ basePath = "/staff" }: { basePath?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      meta?.setAttribute("content", "");
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ title: "Enter username and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { user } = await login(username.trim(), password);
      toast({ title: `Welcome, ${user.fullName || user.username}` });
      setLocation(user.role === "admin" ? p(basePath, "/dashboard") : p(basePath, "/my-dashboard"));
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background (dark purple to deep blue) */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #1e3a5f 50%, #0f172a 75%, #1e1b4b 100%)",
          backgroundSize: "200% 200%",
          animation: "staff-login-bg 8s ease infinite",
        }}
      />

      {/* Soft radial glow behind card */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute w-[min(100vw,480px)] h-[420px] rounded-full blur-[100px]"
          style={{
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(30, 27, 75, 0.1) 50%, transparent 70%)",
            animation: "staff-login-glow-float 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Glass card container: rounded inverted-triangle style, floating */}
      <div
        className="relative w-full max-w-md mx-auto"
        style={{
          animation: "staff-login-float 4s ease-in-out infinite",
        }}
      >
        <div
          className="relative rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/20 overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            clipPath: "polygon(0% 0%, 100% 0%, 100% calc(100% - 24px), 50% 100%, 0% calc(100% - 24px))",
            animation: "staff-login-card-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
            opacity: 0,
          }}
        >
          {/* Inner border glow */}
          <div
            className="absolute inset-0 rounded-[2rem] pointer-events-none"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 100% calc(100% - 24px), 50% 100%, 0% calc(100% - 24px))",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
            }}
          />

          <div className="relative">
            <h1 className="text-2xl font-semibold text-white tracking-tight text-center mb-1">
              Express Staff Portal
            </h1>
            <p className="text-sm text-white/60 text-center mb-8">
              Sign in with your username and password
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-white/90">
                  Username
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-focus-within:text-indigo-300 transition-colors pointer-events-none z-10" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    disabled={loading}
                    className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:border-indigo-400/50 transition-all duration-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/90">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-focus-within:text-indigo-300 transition-colors pointer-events-none z-10" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={loading}
                    className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:border-indigo-400/50 transition-all duration-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Stay signed in + Forgot password */}
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={staySignedIn}
                    onCheckedChange={(v) => setStaySignedIn(v === true)}
                    className="border-white/30 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  <span className="text-sm text-white/70">Stay signed in</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign in button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-medium text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
