"use client";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400">Log in to join your next meeting</p>
      </div>
      
      <SignIn 
        appearance={{
          baseTheme: dark,
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-sm normal-case',
            card: 'bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl'
          }
        }}
        // Redirects to lobby after successful Gmail login
        forceRedirectUrl="/" 
        signUpUrl="/register"
      />
    </div>
  );
}