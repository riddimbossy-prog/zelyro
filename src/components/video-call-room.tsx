import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  SwitchCamera,
  Lock,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatMoney, formatTime } from "@/lib/utils";
import { usePlayer } from "@/lib/zelyro/player";
import { endVideoCall, startVideoCall, type VideoSession } from "@/lib/zelyro/video-actions";
import { useVideoCall } from "@/lib/zelyro/use-video-call";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { toast } from "sonner";

type Phase = "lobby" | "live" | "ended";

export function VideoCallRoom({ session }: { session: VideoSession }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const pause = usePlayer((s) => s.pause);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [phase, setPhase] = useState<Phase>(
    session.status === "ended" ? "ended" : session.status === "live" ? "live" : "lobby",
  );
  const [elapsed, setElapsed] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const isHost = Boolean(user && user.id === session.artistId);
  const displayName = user?.displayName || (isHost ? session.artistName : "Fan");
  const call = useVideoCall({
    room: session.id,
    name: displayName,
    stream,
    enabled: phase === "live",
  });
  const otherName = isHost ? session.fanName ?? call.peers[0]?.name ?? "Waiting for a fan" : session.artistName;
  const remoteLive = Boolean(call.remoteStream && call.remoteStream.getTracks().some((t) => t.readyState === "live"));

  useEffect(() => {
    pause();
  }, [pause]);

  useEffect(() => {
    let media: MediaStream | null = null;
    let cancelled = false;
    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("This browser cannot open a camera.");
        return;
      }
      try {
        media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(media);
        setCamError(null);
      } catch {
        setCamError("Camera or mic is blocked. You can still join — they will see your avatar.");
      }
    })();
    return () => {
      cancelled = true;
      media?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  useEffect(() => {
    const el = localRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    void el.play().catch(() => undefined);
  }, [stream, phase, camOn, remoteLive]);

  useEffect(() => {
    const el = remoteRef.current;
    if (!el) return;
    el.srcObject = call.remoteStream;
    el.muted = !speakerOn;
    if (call.remoteStream) void el.play().catch(() => undefined);
  }, [call.remoteStream, speakerOn, phase]);

  useEffect(() => {
    stream?.getAudioTracks().forEach((t) => {
      t.enabled = micOn;
    });
    stream?.getVideoTracks().forEach((t) => {
      t.enabled = camOn;
    });
  }, [stream, micOn, camOn]);

  useEffect(() => {
    if (phase !== "live") return;
    const t = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const remaining = Math.max(0, session.durationMin * 60 - elapsed);
  const showLocal = Boolean(stream && camOn && !camError);

  async function join() {
    try {
      await startVideoCall({ data: session.id });
      setPhase("live");
      setElapsed(0);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not join");
    }
  }

  async function hangUp() {
    setPhase("ended");
    stream?.getTracks().forEach((t) => t.stop());
    try {
      await endVideoCall({ data: session.id });
    } catch {
      /* still leave */
    }
  }

  const linkLabel =
    call.connectionState === "connected"
      ? call.candidateType === "relay"
        ? "Relayed"
        : "Direct"
      : call.connectionState === "connecting" || call.connectionState === "new"
        ? "Connecting"
        : call.connectionState === "failed"
          ? "Unreachable"
          : "Waiting";

  if (phase === "ended") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
        <p className="text-xs tracking-[0.2em] text-sand uppercase">Call ended</p>
        <h1 className="mt-3 text-center font-display text-4xl">Thanks for showing up</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session.artistName} · {formatTime(elapsed || 0)}
        </p>
        <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="mt-1 font-display text-xl">{formatMoney(session.priceCents, session.currency)}</p>
          </div>
          <div className="rounded-2xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Slot</p>
            <p className="mt-1 font-display text-xl">{session.durationMin} min</p>
          </div>
        </div>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Button onClick={() => navigate({ to: "/studio" })}>Back to studio</Button>
          <Button variant="outline" asChild>
            <Link to="/community">Community</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <div className="relative flex min-h-dvh flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-secondary"
            onClick={() => navigate({ to: "/studio" })}
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">1-1 Video</p>
          <span className="w-11" />
        </header>
        <div className="mx-auto w-full max-w-md flex-1 px-5 pb-8">
          <div className="relative overflow-hidden rounded-[28px] bg-card">
            <div className="relative aspect-[3/4] bg-secondary">
              <video
                ref={localRef}
                className={cn("size-full object-cover", !showLocal && "hidden")}
                autoPlay
                playsInline
                muted
              />
              {!showLocal && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <img
                    src={user?.profileImageUrl ?? session.artistAvatar ?? "/favicon.svg"}
                    alt=""
                    className="size-24 rounded-full object-cover"
                  />
                  <p className="max-w-xs px-6 text-center text-sm text-muted-foreground">{camError ?? "Camera off"}</p>
                </div>
              )}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                <RoundToggle on={!micOn} label={micOn ? "Mute" : "Unmute"} onClick={() => setMicOn((v) => !v)}>
                  {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                </RoundToggle>
                <RoundToggle on={!camOn} label={camOn ? "Camera off" : "Camera on"} onClick={() => setCamOn((v) => !v)}>
                  {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
                </RoundToggle>
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs tracking-widest text-muted-foreground uppercase">
            {isHost ? "Waiting room" : "Fan session"}
          </p>
          <h1 className="mt-1 font-display text-3xl">{session.artistName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.durationMin} minutes · {formatMoney(session.priceCents, session.currency)}
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={() => void join()}>
            {isHost ? "Go live" : "Join call"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Peer-to-peer. Signaling only — camera never uploads to VerzZify.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <img src={session.artistAvatar ?? "/banners/accra.jpg"} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
      <video
        ref={remoteRef}
        className={cn("absolute inset-0 size-full object-cover", !remoteLive && "hidden")}
        autoPlay
        playsInline
      />
      {!remoteLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showLocal && !remoteLive ? (
            <video ref={localRef} className="absolute inset-0 size-full object-cover" autoPlay playsInline muted />
          ) : (
            <img
              src={isHost ? user?.profileImageUrl ?? "/favicon.svg" : session.artistAvatar ?? "/favicon.svg"}
              alt=""
              className="size-32 rounded-full object-cover ring-2 ring-border"
            />
          )}
        </div>
      )}
      <header className="absolute top-0 right-0 left-0 z-20 flex items-start justify-between p-4">
        <div className="rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                call.connectionState === "connected" ? "bg-primary" : "bg-muted-foreground",
              )}
            />
            {linkLabel}
          </span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="tabular">{formatTime(elapsed)}</span>
        </div>
        <div className="rounded-full bg-background/80 px-3 py-1.5 text-xs tabular backdrop-blur-sm">
          <Clock className="mr-1 inline size-3" />
          {formatTime(remaining)} left
        </div>
      </header>
      <div className="absolute top-16 left-4 z-20">
        <p className="font-display text-xl">{otherName}</p>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" /> {call.connectionState === "connected" ? "Peer-to-peer" : "Signaling…"}
        </p>
      </div>
      <div className="absolute right-4 bottom-28 z-20 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        {remoteLive && showLocal ? (
          <video ref={localRef} className="h-36 w-28 object-cover" autoPlay playsInline muted />
        ) : remoteLive ? (
          <div className="grid h-36 w-28 place-items-center">
            <VideoOff className="size-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="grid h-36 w-28 place-items-center px-2 text-center text-[11px] text-muted-foreground">
            You
          </div>
        )}
      </div>
      {call.connectionState === "failed" && (
        <p className="absolute bottom-32 left-4 right-4 z-20 text-center text-xs text-muted-foreground">
          Couldn't reach them on this network. Ask them to rejoin.
        </p>
      )}
      <nav className="absolute right-0 bottom-0 left-0 z-20 flex items-center justify-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <RoundToggle on={!micOn} label={micOn ? "Mute" : "Unmute"} onClick={() => setMicOn((v) => !v)}>
          {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </RoundToggle>
        <RoundToggle on={!camOn} label={camOn ? "Camera off" : "Camera on"} onClick={() => setCamOn((v) => !v)}>
          {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </RoundToggle>
        <button
          type="button"
          aria-label="End call"
          onClick={() => void hangUp()}
          className="grid size-16 place-items-center rounded-full bg-destructive text-destructive-foreground"
        >
          <PhoneOff className="size-6" />
        </button>
        <RoundToggle on={!speakerOn} label={speakerOn ? "Speaker" : "Muted"} onClick={() => setSpeakerOn((v) => !v)}>
          {speakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </RoundToggle>
        <RoundToggle on={false} label="Flip camera" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>
          <SwitchCamera className="size-5" />
        </RoundToggle>
      </nav>
    </div>
  );
}

function RoundToggle({
  on,
  label,
  onClick,
  children,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-12 place-items-center rounded-full",
        on ? "bg-foreground text-background" : "bg-secondary/90 text-foreground",
      )}
    >
      {children}
    </button>
  );
}
