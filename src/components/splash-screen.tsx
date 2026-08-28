import { useEffect, useRef, useState } from "react";

const SRC = "/splash.mp4";
const POSTER = "/splash.jpg";

export function SplashScreen() {
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const done = useRef(false);

  useEffect(() => {
    const hide = () => {
      if (done.current) return;
      done.current = true;
      setFade(true);
      window.setTimeout(() => setGone(true), 420);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      hide();
      return;
    }
    const max = window.setTimeout(hide, 6800);
    return () => window.clearTimeout(max);
  }, []);

  if (gone) return null;

  return (
    <div
      className={`vz-splash${fade ? " vz-splash-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="VerzZify"
    >
      {videoOk ? (
        <video
          className="vz-splash-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={POSTER}
          src={SRC}
          onError={() => setVideoOk(false)}
          onEnded={() => {
            if (done.current) return;
            done.current = true;
            setFade(true);
            window.setTimeout(() => setGone(true), 420);
          }}
        />
      ) : (
        <svg className="vz-splash-video" viewBox="0 0 200 200" aria-hidden="true">
          <rect width="200" height="200" rx="44" fill="#0b0612" />
          <text x="34" y="128" fill="#e879f9" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="78">
            zZ
          </text>
          <path d="M152 62c8 0 14 6 14 14 0 16-14 22-14 36h-10c0-18 14-22 14-36 0-6-3-8-6-8-8 0-8 10-18 10-8 0-12-6-12-12s8-14 22-14z" fill="#e879f9" />
        </svg>
      )}
    </div>
  );
}
