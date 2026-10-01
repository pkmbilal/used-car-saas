import type { ReactNode, SVGProps } from "react";

// Inline stroke icons shared across the public pages (24px grid).
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function icon(paths: ReactNode) {
  return function Icon({ size = 16, strokeWidth = 2, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </>,
);
export const PinIcon = icon(
  <>
    <path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </>,
);
export const ArrowRightIcon = icon(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeftIcon = icon(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const ChevronLeftIcon = icon(<path d="M15 6l-6 6 6 6" />);
export const ChevronRightIcon = icon(<path d="M9 6l6 6-6 6" />);
export const ChevronDownIcon = icon(<path d="M6 9l6 6 6-6" />);
export const CarIcon = icon(
  <>
    <path d="M5 16V11l2-5h10l2 5v5" />
    <path d="M3 11h18v5H3z" />
    <path d="M6 16v2M18 16v2" />
  </>,
);
export const FuelIcon = icon(<path d="M5 21V4h9v17M3 21h13M14 9h3l2 2v7a1.5 1.5 0 01-3 0v-4h-2M8 8h3" />);
export const ShieldIcon = icon(
  <>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </>,
);
export const PhoneIcon = icon(
  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" />,
);
export const WhatsAppIcon = icon(
  <>
    <path d="M21 12a9 9 0 01-13.4 7.8L3 21l1.2-4.4A9 9 0 1121 12z" />
    <path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z" />
  </>,
);
export const ShareIcon = icon(
  <>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
  </>,
);
export const FilterIcon = icon(<path d="M3 6h18M6 12h12M10 18h4" />);
export const CalendarIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
);
export const GaugeIcon = icon(
  <>
    <path d="M4 18a9 9 0 1116 0" />
    <path d="M12 14l4-4" />
  </>,
);
export const BadgeIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9l-7.5 4.5M12 12l7.5 4.5" />
  </>,
);
export const SparkleIcon = icon(<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />);
export const ClockIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const TagIcon = icon(
  <>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.3" />
  </>,
);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const DocIcon = icon(
  <>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M9 11h7M9 15h7" />
  </>,
);
export const UsersIcon = icon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" />
    <path d="M17 8v6M14 11h6" />
  </>,
);
export const ChatIcon = icon(
  <>
    <path d="M4 5h16v11H8l-4 4z" />
    <path d="M8 10h8" />
  </>,
);
export const CompareIcon = icon(<path d="M7 4v16M17 4v16M3 8h8M13 16h8" />);
export const MenuIcon = icon(<path d="M4 7h16M4 12h16M4 17h16" />);

// Wordmark swoosh from the DriveLoop design.
export function LogoMark({ width = 90, color = "#4fd06a" }: { width?: number; color?: string }) {
  return (
    <svg width={width} height={(width * 34) / 96} viewBox="0 0 96 34" fill="none" aria-hidden="true">
      <path d="M2 20c10-2 18-10 34-12 18-2 36 2 52 8 4 2 6 4 6 6" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M14 22c18 0 50 0 70-2" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M78 24c0 6-4 9-8 9" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
