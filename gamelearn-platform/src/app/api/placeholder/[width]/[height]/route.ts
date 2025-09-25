import { NextRequest } from "next/server"

interface Params {
  params: { width: string; height: string }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const width = Math.max(1, Math.min(4096, parseInt(params.width, 10) || 400))
  const height = Math.max(1, Math.min(4096, parseInt(params.height, 10) || 225))

  const bg = "#e5e7eb" // Tailwind gray-200
  const fg = "#6b7280" // Tailwind gray-500
  const fontSize = Math.max(12, Math.floor(Math.min(width, height) / 8))
  const text = `${width}×${height}`

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5f5f5"/>
        <stop offset="100%" stop-color="${bg}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g fill="${fg}" font-family="-apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="middle">
      <text x="50%" y="50%" dominant-baseline="middle">${text}</text>
    </g>
  </svg>`

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}