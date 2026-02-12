"use client";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-slate-400">Join the Zoom Clone network today</p>
      </div>

      <SignUp 
        appearance={{
          baseTheme: dark,
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-sm normal-case',
            card: 'bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl'
          }
        }}
        forceRedirectUrl="/"
        signInUrl="/login"
      />
    </div>
  );
}