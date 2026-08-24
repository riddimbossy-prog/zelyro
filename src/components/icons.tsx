import { memo, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/** Slim Lucide subset — only the glyphs this app uses, memoized, no lucide runtime. */
export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function Svg({ className, size, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size ?? 24}
      height={size ?? 24}
      aria-hidden
      className={cn("lucide shrink-0", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowLeft = memo(function ArrowLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </Svg>
  );
});

export const BadgeCheck = memo(function BadgeCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
    </Svg>
  );
});

export const Bookmark = memo(function Bookmark(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </Svg>
  );
});

export const Check = memo(function Check(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
});

export const ChevronDown = memo(function ChevronDown(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
});

export const ChevronLeft = memo(function ChevronLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  );
});

export const ChevronRight = memo(function ChevronRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
});

export const Compass = memo(function Compass(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" /><circle cx="12" cy="12" r="10" />
    </Svg>
  );
});

export const Copy = memo(function Copy(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </Svg>
  );
});

export const Disc3 = memo(function Disc3(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" /><path d="M6 12c0-1.7.7-3.2 1.8-4.2" /><circle cx="12" cy="12" r="2" /><path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
    </Svg>
  );
});

export const Download = memo(function Download(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </Svg>
  );
});

export const Flag = memo(function Flag(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" />
    </Svg>
  );
});

export const FolderDown = memo(function FolderDown(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M12 10v6" /><path d="m15 13-3 3-3-3" />
    </Svg>
  );
});

export const Heart = memo(function Heart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Svg>
  );
});

export const House = memo(function House(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
});

export const ImagePlus = memo(function ImagePlus(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 5h6" /><path d="M19 2v6" /><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /><circle cx="9" cy="9" r="2" />
    </Svg>
  );
});

export const Link2 = memo(function Link2(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><line x1="8" x2="16" y1="12" y2="12" />
    </Svg>
  );
});

export const ListMusic = memo(function ListMusic(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 15V6" /><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path d="M12 12H3" /><path d="M16 6H3" /><path d="M12 18H3" />
    </Svg>
  );
});

export const LoaderCircle = memo(function LoaderCircle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </Svg>
  );
});

export const MapPin = memo(function MapPin(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />
    </Svg>
  );
});

export const MessageCircle = memo(function MessageCircle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Svg>
  );
});

export const Mic = memo(function Mic(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
    </Svg>
  );
});

export const Mic2 = memo(function Mic2(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12" /><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5" /><circle cx="16" cy="7" r="5" />
    </Svg>
  );
});

export const MicOff = memo(function MicOff(p: IconProps) {
  return (
    <Svg {...p}>
      <line x1="2" x2="22" y1="2" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" x2="12" y1="19" y2="22" />
    </Svg>
  );
});

export const Pause = memo(function Pause(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />
    </Svg>
  );
});

export const PhoneOff = memo(function PhoneOff(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" /><path d="M22 2 2 22" /><path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </Svg>
  );
});

export const Play = memo(function Play(p: IconProps) {
  return (
    <Svg {...p}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </Svg>
  );
});

export const Radio = memo(function Radio(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </Svg>
  );
});

export const Repeat = memo(function Repeat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </Svg>
  );
});

export const Search = memo(function Search(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />
    </Svg>
  );
});

export const Share2 = memo(function Share2(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </Svg>
  );
});

export const ShoppingBag = memo(function ShoppingBag(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </Svg>
  );
});

export const Shuffle = memo(function Shuffle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m18 14 4 4-4 4" /><path d="m18 2 4 4-4 4" /><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" /><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" /><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
    </Svg>
  );
});

export const SkipBack = memo(function SkipBack(p: IconProps) {
  return (
    <Svg {...p}>
      <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" x2="5" y1="19" y2="5" />
    </Svg>
  );
});

export const SkipForward = memo(function SkipForward(p: IconProps) {
  return (
    <Svg {...p}>
      <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" x2="19" y1="5" y2="19" />
    </Svg>
  );
});

export const SwitchCamera = memo(function SwitchCamera(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /><path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" /><circle cx="12" cy="12" r="3" /><path d="m18 22-3-3 3-3" /><path d="m6 2 3 3-3 3" />
    </Svg>
  );
});

export const Ticket = memo(function Ticket(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </Svg>
  );
});

export const Trash2 = memo(function Trash2(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
    </Svg>
  );
});

export const TriangleAlert = memo(function TriangleAlert(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </Svg>
  );
});

export const Trophy = memo(function Trophy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Svg>
  );
});

export const Upload = memo(function Upload(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </Svg>
  );
});

export const UserCheck = memo(function UserCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
    </Svg>
  );
});

export const UserPlus = memo(function UserPlus(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
    </Svg>
  );
});

export const UserRound = memo(function UserRound(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" />
    </Svg>
  );
});

export const Users = memo(function Users(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" />
    </Svg>
  );
});

export const Video = memo(function Video(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
    </Svg>
  );
});

export const VideoOff = memo(function VideoOff(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" /><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" /><path d="m2 2 20 20" />
    </Svg>
  );
});

export const Volume2 = memo(function Volume2(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </Svg>
  );
});

export const VolumeX = memo(function VolumeX(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" />
    </Svg>
  );
});

export const X = memo(function X(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </Svg>
  );
});

