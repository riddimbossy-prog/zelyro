import { useEffect, useRef, useState } from "react";

const SRC = "/splash.mp4";
const POSTER = "/splash.jpg";

export function SplashScreen() {
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);
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
      <video
        className="vz-splash-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={POSTER}
        src={SRC}
        onEnded={() => {
          if (done.current) return;
          done.current = true;
          setFade(true);
          window.setTimeout(() => setGone(true), 420);
        }}
      />
    </div>
  );
}
