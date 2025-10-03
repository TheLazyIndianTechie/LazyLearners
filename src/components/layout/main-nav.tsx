"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2" aria-label="GameLearn home">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <span className="font-bold text-xl">GameLearn</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
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
                aria-current={pathname === item.href ? "page" : undefined}
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
            <div className="hidden sm:flex items-center space-x-2">
              <SignInButton>
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button>Start Learning</Button>
              </SignUpButton>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]" aria-label="Mobile navigation">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8" role="navigation" aria-label="Mobile navigation menu">
                {navigation.map((item) => {
                  // Hide auth-required items when not logged in
                  if (item.authRequired && !isLoggedIn) return null

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary px-4 py-3 rounded-md min-h-[44px] flex items-center",
                        pathname === item.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground"
                      )}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  )
                })}

                {/* Mobile Auth Buttons */}
                {!isLoggedIn && (
                  <div className="flex flex-col gap-2 mt-4 px-4">
                    <SignInButton>
                      <Button variant="outline" className="w-full min-h-[44px]">Sign In</Button>
                    </SignInButton>
                    <SignUpButton>
                      <Button className="w-full min-h-[44px]">Start Learning</Button>
                    </SignUpButton>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}