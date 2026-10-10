"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { auth, RegisterInput, LoginInput } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GPSLocationInput from "@/components/GPSLocationInput";

export default function AuthPage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login Form State
  const [loginForm, setLoginForm] = useState<LoginInput>({
    email: "",
    password: "",
  });

  // Register Form State
  const [regForm, setRegForm] = useState<RegisterInput & { confirmPassword: string }>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    city: "",
    disabilityType: "none",
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: (body: LoginInput) => auth.login(body),
    onSuccess: (res) => {
      const { user: u, accessToken } = (res as any).data.data;
      setAuth(u, accessToken);
      router.push("/profile");
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: (body: RegisterInput) => auth.register(body),
    onSuccess: (res) => {
      const { user: u, accessToken } = (res as any).data.data;
      setAuth(u, accessToken);
      router.push("/profile");
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    loginMutation.mutate(loginForm);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (regForm.password !== regForm.confirmPassword) {
      setFormError("Passwords do not match. Please verify and re-enter.");
      return;
    }

    if (regForm.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    const { confirmPassword, ...body } = regForm;
    const payload: RegisterInput = {
      ...body,
      mobile: body.mobile?.trim() || undefined,
      city: body.city?.trim() || undefined,
    };
    registerMutation.mutate(payload);
  };

  if (user) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-gutter bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest max-w-md w-full p-space-xl rounded-2xl border border-surface-container shadow-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Already Signed In</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 mb-6">
            You are logged in as <strong className="text-on-surface">{user.fullName}</strong> ({user.email}).
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="py-3 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container transition-all"
            >
              Go to My Profile
            </Link>
            <Link
              href="/"
              className="py-2.5 px-6 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            >
              Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto px-gutter flex flex-col gap-space-md">
        {/* Banner Switch to Volunteer */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-2xl p-space-sm flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[16px] text-secondary">handshake</span>
            Are you registering as a volunteer responder?
          </span>
          <Link
            href="/volunteer-portal"
            className="text-primary hover:underline font-bold shrink-0 ml-2"
          >
            Volunteer Portal →
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md border border-surface-container-high">
          {/* Header */}
          <div className="text-center mb-space-lg">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[28px]">account_circle</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">
              {tab === "login" ? "Welcome to HelpCorps" : "Create Citizen Account"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {tab === "login"
                ? "Sign in to submit and track assistance requests"
                : "Register for mobility, hearing, vision & senior care assistance"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-surface-container p-1 rounded-xl mb-space-lg">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setFormError(null);
              }}
              className={`flex-1 py-2 rounded-lg font-label-md text-label-md font-bold transition-all ${
                tab === "login"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setFormError(null);
              }}
              className={`flex-1 py-2 rounded-lg font-label-md text-label-md font-bold transition-all ${
                tab === "register"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {(formError || loginMutation.isError || registerMutation.isError) && (
            <div className="mb-space-md p-3 rounded-xl bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>
                {formError ??
                  (loginMutation.error as any)?.response?.data?.error?.message ??
                  (loginMutation.error as any)?.response?.data?.message ??
                  (registerMutation.error as any)?.response?.data?.error?.message ??
                  (registerMutation.error as any)?.response?.data?.message ??
                  "Authentication failed. Please check your details."}
              </span>
            </div>
          )}

          {/* Form 1: Login */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-space-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Password *
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-space-md"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                {loginMutation.isPending ? "Signing in..." : "Sign In to Account"}
              </button>
            </form>
          )}

          {/* Form 2: Register */}
          {tab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-space-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  required
                  placeholder="e.g. Hardik Kumar"
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={regForm.mobile}
                  onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                  placeholder="+91..."
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <GPSLocationInput
                  label="City or Area (with GPS Auto-Detect)"
                  placeholder="e.g. Hamirpur, Himachal Pradesh"
                  value={regForm.city || ""}
                  onChange={(val) => setRegForm({ ...regForm, city: val })}
                  autoDetectOnMount={true}
                  helperText="Auto-detects via GPS or enter custom area"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Special Accommodation (if needed)
                </label>
                <select
                  value={regForm.disabilityType}
                  onChange={(e) => setRegForm({ ...regForm, disabilityType: e.target.value })}
                  className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="none">None (Standard Community)</option>
                  <option value="deaf">Deaf & ASL Assistance</option>
                  <option value="blind">Blind & Vision Audio Guidance</option>
                  <option value="handicapped">Mobility / Physical Escort</option>
                  <option value="elderly">Elderly Senior Care</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    required
                    placeholder="Min 6 characters"
                    className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    required
                    placeholder="Repeat password"
                    className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-space-md"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                {registerMutation.isPending ? "Creating Account..." : "Create Citizen Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
