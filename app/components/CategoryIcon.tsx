import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function DogIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10 5.172a3 3 0 0 0-3 3v2.828c0 .53.21 1.04.586 1.414l5.656 5.656a3 3 0 0 0 4.243 0L19 16.828a3 3 0 0 0 0-4.242L13.343 6.93a3 3 0 0 0-1.414-.586h-.586Z" />
      <path d="M16 16v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1" />
      <path d="M10 9h.01" />
      <path d="M14 9h.01" />
      <path d="M8 13.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function CatIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5c.67 0 1.35.09 2 .26L18.5 2 18 7.5c1.6 1.45 2.5 3.5 2.5 5.5a8.5 8.5 0 0 1-17 0c0-2 1-4.05 2.5-5.5L5.5 2l4.5 3.26c.65-.17 1.33-.26 2-.26Z" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
      <path d="M12 16v-.5" />
    </svg>
  );
}

export function BoneIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5a2.85 2.85 0 1 1-4-4L17 3Z" />
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5a2.85 2.85 0 1 1-4-4L17 3Z" />
      <path d="M16.85 3.15a2.85 2.85 0 1 1 4 4L7.5 20.5a2.85 2.85 0 1 1-4-4Z" />
    </svg>
  );
}

export function DropletIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

export function PawIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="14" r="4" />
      <circle cx="6.5" cy="9.5" r="2" />
      <circle cx="10" cy="5.5" r="2" />
      <circle cx="14" cy="5.5" r="2" />
      <circle cx="17.5" cy="9.5" r="2" />
    </svg>
  );
}
