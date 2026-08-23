import { useCallback, useEffect, useRef, useState } from "react";
import { P2PRoom, type PeerInfo } from "@/lib/multiplayer";

export function rtcId(value: string): string {
  const s = value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return s.length ? s : "room";
}

export type VideoCallHandle = {
  selfId: string;
  joined: boolean;
  peers: PeerInfo[];
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "waiting";
  candidateType: string | null;
};

export function useVideoCall(opts: {
  room: string;
  name: string;
  stream: MediaStream | null;
  enabled: boolean;
}): VideoCallHandle {
  const [selfId] = useState(() => `p-${Math.random().toString(36).slice(2, 10)}`);
  const [room] = useState(() => rtcId(opts.room));
  const [name] = useState(() => opts.name.slice(0, 64));
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [joined, setJoined] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const roomRef = useRef<P2PRoom | null>(null);

  useEffect(() => {
    if (!opts.enabled) return;
    const p2p = new P2PRoom({
      room,
      selfId,
      name,
      localStream: opts.stream,
      maxRemotes: 1,
      onPeersChanged: setPeers,
      onTrack: (_from, stream) => setRemoteStream(stream),
      onConnected: () => setJoined(true),
    });
    roomRef.current = p2p;
    void p2p.join();
    return () => {
      roomRef.current = null;
      p2p.close();
      setRemoteStream(null);
      setJoined(false);
      setPeers([]);
    };
    // stream is attached separately so camera flips don't tear the mesh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, room, selfId, name]);

  const attach = useCallback((stream: MediaStream | null) => {
    roomRef.current?.attachLocalStream(stream);
  }, []);

  useEffect(() => {
    attach(opts.stream);
  }, [opts.stream, attach]);

  const remote = peers[0];
  return {
    selfId,
    joined,
    peers,
    remoteStream,
    connectionState: remote?.connectionState ?? (joined ? "waiting" : "waiting"),
    candidateType: remote?.candidateType ?? null,
  };
}
