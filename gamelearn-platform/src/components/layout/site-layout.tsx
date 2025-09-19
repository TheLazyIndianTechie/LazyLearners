"use client"

import { MainNav } from "./main-nav"

interface SiteLayoutProps {
  children: React.ReactNode
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-background">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">G</span>
                </div>
                <span className="font-bold">GameLearn</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The premier platform for game development education, combining proven learning methods with cutting-edge technology.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/courses" className="hover:text-foreground">Courses</a></li>
                <li><a href="/dashboard" className="hover:text-foreground">Dashboard</a></li>
                <li><a href="/portfolio" className="hover:text-foreground">Portfolio</a></li>
                <li><a href="/community" className="hover:text-foreground">Community</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Learning</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/courses/unity" className="hover:text-foreground">Unity Development</a></li>
                <li><a href="/courses/unreal" className="hover:text-foreground">Unreal Engine</a></li>
                <li><a href="/courses/godot" className="hover:text-foreground">Godot</a></li>
                <li><a href="/courses/programming" className="hover:text-foreground">Game Programming</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/help" className="hover:text-foreground">Help Center</a></li>
                <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
                <li><a href="/privacy" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 GameLearn Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}