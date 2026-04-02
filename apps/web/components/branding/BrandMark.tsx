import type { CSSProperties } from "react";

type BrandMarkProps = {
  className?: string;
  style?: CSSProperties;
  size?: number;
  background?: string;
  color?: string;
};

export function BrandMark({ className, style, size, background, color }: BrandMarkProps) {
  return (
    <span
      className={className}
      style={{
        ...(size ? { width: size, height: size } : {}),
        ...(background ? { background } : {}),
        ...(color ? { color } : {}),
        ...style
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none">
        <path
          d="M16 44c0-15 10-25 26-27 0 14-8 26-23 29-1 .2-2.1-.7-2.4-2Z"
          fill="currentColor"
          opacity="0.95"
        />
        <path
          d="M20 46c5-7 12-13 22-18"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.82"
        />
        <path
          d="M41 18l9 7-7 10 9 6"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
        <circle cx="50" cy="25" r="4.5" fill="currentColor" />
        <circle cx="43" cy="35" r="4.5" fill="currentColor" />
        <circle cx="52" cy="41" r="4.5" fill="currentColor" />
      </svg>
    </span>
  );
}
