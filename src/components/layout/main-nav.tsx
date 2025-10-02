"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Courses", href: "/courses" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Dashboard", href: "/dashboard", authRequired: true },
  { name: "Portfolio", href: "/portfolio", authRequired: true },
  { name: "Community", href: "/community" },
]

export function MainNav() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  const isLoggedIn = isSignedIn

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <span className="font-bold text-xl">GameLearn</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => {
            // Hide auth-required items when not logged in
            if (item.authRequired && !isLoggedIn) return null

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          ) : (
            <div className="flex items-center space-x-2">
              <SignInButton>
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button>Start Learning</Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}