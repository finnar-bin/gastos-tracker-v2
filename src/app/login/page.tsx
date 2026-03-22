"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, loginWithGoogle } from "./actions";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormErrors } from "@/lib/form-state";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 section-padding">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            Gastos Tracker
          </CardTitle>
          <CardDescription>Track your finances with ease</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/sheet";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const result = await login(new FormData(event.currentTarget));

      if (result.defaultValues?.email !== undefined) {
        setEmail(result.defaultValues.email);
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      setFormError(result.error ?? "Unable to log in.");
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("Login failed:", error);
      setFormError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 section-padding">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            Gastos Tracker
          </CardTitle>
          <CardDescription>Track your finances with ease</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            {formError ? (
              <p className="text-sm font-medium text-destructive">
                {formError}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? (
                <p className="text-xs font-medium text-destructive">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-xs font-medium text-destructive">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <LoadingButton
                type="submit"
                className="w-full cursor-pointer"
                text="Log in"
                loadingText="Logging in..."
                loading={loading}
                trackFormStatus={false}
              />
              <Button asChild variant="outline" className="w-full">
                <Link href={`/signup?next=${encodeURIComponent(next)}`}>
                  Sign up
                </Link>
              </Button>
            </div>
          </form>
          <div className="relative mb-2 mt-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            onClick={() => loginWithGoogle(next)}
            variant="outline"
            className="w-full cursor-pointer bg-[#fbbc04] text-black hover:bg-[#f3b400] dark:bg-[#fbbc04] dark:text-black dark:hover:bg-[#f3b400]"
          >
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
