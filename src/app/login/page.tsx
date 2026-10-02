"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          router.push("/dashboard");
        } else {
          setSuccessMsg(
            "Account created! Please check your email for a confirmation link, or log in directly if confirmation is disabled."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-page">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-white shadow-card mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal">
            Daily Routine Tracker
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Private, High-Performance Habit & Routine Logging
          </p>
        </div>

        <Card className="shadow-dropdown border-border-subtle bg-white">
          <CardHeader className="text-center pb-2">
            <CardTitle>{isSignUp ? "Create Private Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isSignUp
                ? "Set up your credentials to begin tracking routines"
                : "Enter your personal credentials to access your routines"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 rounded-md bg-status-error-bg p-3 text-xs text-status-error border border-red-200">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-md bg-status-success-bg p-3 text-xs text-status-success border border-green-200">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="pl-9"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-muted" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="pl-9"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-muted" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                <span>{isSignUp ? "Register Account" : "Access Workspace"}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs text-forest hover:text-forest-dark font-medium transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "First time setup? Create an account"}
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-charcoal-muted mt-2">
                <ShieldCheck className="h-3.5 w-3.5 text-forest" />
                <span>Protected with Supabase Row Level Security</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
