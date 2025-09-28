"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">Start your game development journey today</p>
        </div>

        <div className="bg-background border rounded-lg shadow-sm p-6">
          <SignUp
            routing="path"
            path="/auth/signup"
            signInUrl="/auth/signin"
            afterSignUpUrl="/dashboard"
            afterSignInUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  )
}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}