import { ImageResponse } from "next/og"

export const alt = 'QQQ CC Dashboard'
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontSize: 260 }}>📈</div>
        <div style={{ fontSize: 60, fontWeight: 600, color: "#1d1d1f", marginTop: 20 }}>
          QQQ CC Dashboard
        </div>
        <div style={{ fontSize: 32, color: "#86868b", marginTop: 12 }}>
          tianlizeng.cloud
        </div>
      </div>
    ),
    { ...size }
  )
}
