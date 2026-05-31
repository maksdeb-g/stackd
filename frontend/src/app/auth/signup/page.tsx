"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Mail, Lock, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, verifyOtp, sendOtp, user } = useAuth();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (user && step === "form") router.push("/");
  }, [user, router, step]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    const otpError = await sendOtp(email);
    if (otpError.error) {
      setError(otpError.error);
    }
    setStep("verify");
    setLoading(false);
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  }

  async function handleVerify() {
    const token = code.join("");
    if (token.length !== 6) return;
    setError("");
    setLoading(true);
    const { error } = await verifyOtp(email, token);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    router.push("/");
  }

  async function handleResend() {
    setResending(true);
    setError("");
    const { error } = await sendOtp(email);
    if (error) setError(error);
    setResending(false);
  }

  function handleCodeChange(index: number, value: string) {
    if (value.length > 1) {
      const pasted = value.slice(0, 6 - index).split("");
      const next = [...code];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) next[index + i] = pasted[i];
      }
      setCode(next);
      const nextIdx = Math.min(index + pasted.length, 5);
      inputsRef.current[nextIdx]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  }

  useEffect(() => {
    if (code.every((d) => d !== "")) {
      handleVerify();
    }
  }, [code]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm fade-up">
        {step === "form" ? (
          <>
            <div className="mb-8 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow">
                  <Layers className="h-6 w-6 text-ink" />
                </div>
              </div>
              <h1 className="font-display text-2xl font-bold text-cream">Create account</h1>
              <p className="mt-1 text-sm text-cream/50">Start organizing your learning</p>
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
                    placeholder="At least 6 characters"
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
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-cream/40">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-accent-yellow hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow">
                  <ShieldCheck className="h-6 w-6 text-ink" />
                </div>
              </div>
              <h1 className="font-display text-2xl font-bold text-cream">Check your email</h1>
              <p className="mt-1 text-sm text-cream/50">
                We sent a 6-digit code to <span className="text-cream/80 font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="h-12 w-10 rounded-lg border border-ink-muted bg-ink text-center text-lg font-bold text-cream outline-none focus:border-accent-yellow/50 focus:ring-1 focus:ring-accent-yellow/30 transition-all"
                  />
                ))}
              </div>

              {error && <p className="text-sm text-accent-coral text-center">{error}</p>}

              <button
                onClick={handleVerify}
                disabled={loading || code.some((d) => !d)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-yellow py-2.5 text-sm font-semibold text-ink hover:bg-accent-yellow/90 transition-all disabled:opacity-40"
              >
                {loading ? "Verifying…" : "Verify Code"}
              </button>

              <div className="flex items-center justify-center gap-1 text-sm text-cream/40">
                <span>Didn't receive it?</span>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-accent-yellow hover:underline disabled:opacity-40"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setStep("form")}
                  className="inline-flex items-center gap-1.5 text-sm text-cream/40 hover:text-cream transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Use a different email
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
