import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers/session-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const POSTHOG_CLIENT_KEY = JSON.stringify(POSTHOG_KEY);
const POSTHOG_CLIENT_HOST = JSON.stringify(POSTHOG_HOST);

export const metadata: Metadata = {
  title: "GameLearn Platform - Master Game Development",
  description:
    "Learn game development with expert-led courses on Unity, Unreal Engine, Godot, and more. Build real games and launch your career in the gaming industry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en">
        <body
          className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
        >
          {POSTHOG_KEY ? (
            <Script id="posthog-init" strategy="afterInteractive">
              {`!(function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&((t=t[o[0]]),e=o[1]),(t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)));});}((p=t.createElement("script")).type="text/javascript"),(p.async=!0),(p.src=s.api_host+"/static/array.js");var u=t.getElementsByTagName("script")[0];u.parentNode.insertBefore(p,u);var l=e;void 0!==a?(l=e[a]=[]):(a="posthog"),(l.people=l.people||[]),(l.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e;}),(l.people.toString=function(){return l.toString(1)+".people (stub)";});var c="capture identify alias people.set people.set_once people.unset people.increment people.append people.union people.remove register register_once unregister opt_out_capturing has_opted_out_capturing clear_opt_out_capturing getFeatureFlag getFeatureFlagPayload isFeatureEnabled onFeatureFlags reloadFeatureFlags group setGroup".split(" ");for(var f=0;f<c.length;f++)g(l,c[f]);e._i.push([i,s,a]);}),(e.__SV=1));})(document,window.posthog||[]);posthog.init(${POSTHOG_CLIENT_KEY}, { api_host: ${POSTHOG_CLIENT_HOST} });`}
            </Script>
          ) : null}
          {children}
        </body>
      </html>
    </Providers>
  );
}
