"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to continue your game development journey</p>
        </div>

        <div className="bg-background border rounded-lg shadow-sm p-6">
          <SignIn afterSignInUrl="/dashboard" signUpUrl="/auth/signup" routing="path" path="/auth/signin" />
        </div>
      </div>
    </div>
  )
}