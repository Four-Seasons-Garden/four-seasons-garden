import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0d1117",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Spring — top, pink */}
        <div
          style={{
            position: "absolute",
            top: 1,
            left: 12,
            width: 8,
            height: 13,
            background: "#f0abfc",
            borderRadius: "50%",
            opacity: 0.9,
          }}
        />
        {/* Summer — right, gold */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 1,
            width: 13,
            height: 8,
            background: "#fde68a",
            borderRadius: "50%",
            opacity: 0.9,
          }}
        />
        {/* Autumn — bottom, amber */}
        <div
          style={{
            position: "absolute",
            bottom: 1,
            left: 12,
            width: 8,
            height: 13,
            background: "#fb923c",
            borderRadius: "50%",
            opacity: 0.9,
          }}
        />
        {/* Winter — left, ice blue */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 1,
            width: 13,
            height: 8,
            background: "#bae6fd",
            borderRadius: "50%",
            opacity: 0.9,
          }}
        />
        {/* Emerald center */}
        <div
          style={{
            width: 11,
            height: 11,
            background: "#34d399",
            borderRadius: "50%",
            position: "absolute",
            top: 10.5,
            left: 10.5,
          }}
        />
        {/* Inner highlight */}
        <div
          style={{
            width: 4,
            height: 4,
            background: "#d1fae5",
            borderRadius: "50%",
            position: "absolute",
            top: 12,
            left: 13,
            opacity: 0.6,
          }}
        />
      </div>
    ),
    { width: 32, height: 32 }
  );
}
