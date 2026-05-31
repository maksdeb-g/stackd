"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    else router.push("/");
    setLoading(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm fade-up">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow">
              <Layers className="h-6 w-6 text-ink" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-cream">Welcome back</h1>
          <p className="mt-1 text-sm text-cream/50">Sign in to your Stackd account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-cream/40 mb-1.5 block font-mono uppercase tracking-widest">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-ink-muted bg-ink py-2.5 pl-10 pr-4 text-sm text-cream placeholder-cream/30 outline-none focus:border-accent-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-cream/40 mb-1.5 block font-mono uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-lg border border-ink-muted bg-ink py-2.5 pl-10 pr-4 text-sm text-cream placeholder-cream/30 outline-none focus:border-accent-yellow/50"
              />
            </div>
          </div>

          {error && <p className="text-sm text-accent-coral">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-yellow py-2.5 text-sm font-semibold text-ink hover:bg-accent-yellow/90 transition-all disabled:opacity-40"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-cream/40">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-accent-yellow hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
