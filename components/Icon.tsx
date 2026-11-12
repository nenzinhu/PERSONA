import type { CSSProperties } from "react";

const paths: Record<string, string> = {
  audio: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6",
  image: "M3 4h18v16H3V4Zm0 12 6-6 5 5 3-3 4 4M16 8h.01",
  persona: "M5 19V7a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0M13 7a4 4 0 0 1 6 3v9M9 19v-4",
  message: "M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-6 3V6a2 2 0 0 1 1-2ZM8 9h8M8 13h5",
  reply: "m9 7-5 5 5 5M4 12h10a6 6 0 0 1 6 6",
  conversation:
    "M14 4H5a2 2 0 0 0-2 2v8l4-2h7a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM9 16v2a2 2 0 0 0 2 2h6l4 2V12a2 2 0 0 0-2-2",
  practice: "m10 8 6 4-6 4V8ZM12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z",
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M6 10h12a1 1 0 0 1 1 1v9H5v-9a1 1 0 0 1 1-1ZM12 14v3",
  analyze: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6M7 10h6M10 7v6",
  beyond: "m3 11 18-8-8 18-2-8-8-2Z",
};

export default function Icon({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <svg
      className="icon"
      style={style}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.message} />
    </svg>
  );
}
