"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Share2, Copy, Check, X } from "lucide-react";

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ],
};

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
};

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});

  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const localUserId = useRef(Math.random().toString(36).substring(7)).current;

  // Build the invitation link
  const getInvitationLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/join/${roomId}`;
  };

  useEffect(() => {
    const initMeeting = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
          (typeof window !== "undefined" && window.location.hostname === "localhost"
            ? `ws://localhost:8000/ws/${roomId}`
            : `wss://${window.location.hostname}/ws/${roomId}`);

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          wsRef.current?.send(JSON.stringify({ type: "join", senderId: localUserId }));
        };

        wsRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);

          if (data.targetId && data.targetId !== localUserId) return;

          switch (data.type) {
            case "join":
              const pc = createPeerConnection(data.senderId, stream);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              wsRef.current?.send(JSON.stringify({
                type: "offer",
                senderId: localUserId,
                targetId: data.senderId,
                sdp: offer
              }));
              break;

            case "offer":
              const pcReceive = createPeerConnection(data.senderId, stream);
              await pcReceive.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pcReceive.createAnswer();
              await pcReceive.setLocalDescription(answer);
              wsRef.current?.send(JSON.stringify({
                type: "answer",
                senderId: localUserId,
                targetId: data.senderId,
                sdp: answer
              }));
              break;

            case "answer":
              if (peersRef.current[data.senderId]) {
                await peersRef.current[data.senderId].setRemoteDescription(new RTCSessionDescription(data.sdp));
              }
              break;

            case "ice-candidate":
              if (peersRef.current[data.senderId] && data.candidate) {
                await peersRef.current[data.senderId].addIceCandidate(new RTCIceCandidate(data.candidate));
              }
              break;
          }
        };

      } catch (err) {
        console.error("Error accessing media devices or connecting WebRTC:", err);
      }
    };

    initMeeting();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      wsRef.current?.close();
      Object.values(peersRef.current).forEach(pc => pc.close());
    };
  }, [roomId, localUserId]);

  const createPeerConnection = (partnerId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peersRef.current[partnerId] = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: "ice-candidate",
          senderId: localUserId,
          targetId: partnerId,
          candidate: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [partnerId]: event.streams[0]
      }));
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed") {
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[partnerId];
          return newStreams;
        });
        delete peersRef.current[partnerId];
      }
    };

    return pc;
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCamOn;
      });
      setIsCamOn(!isCamOn);
    }
  };

  const leaveMeeting = () => {
    router.push("/");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInvitationLink()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareViaWeb = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join My Meeting",
          text: "Join me in this video meeting!",
          url: getInvitationLink(),
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    }
  };

  // Compute grid sizing based on participant count (local + remote)
  const participantCount = 1 + Object.keys(remoteStreams).length;
  const gridClass = participantCount === 1
    ? "grid-cols-1 max-w-4xl"
    : participantCount === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-6xl"
      : participantCount <= 4
        ? "grid-cols-2 max-w-6xl"
        : "grid-cols-2 md:grid-cols-3 max-w-7xl";

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded">
            <Users size={18} />
          </div>
          <span className="font-medium">Meeting: <span className="text-blue-400">{roomId}</span></span>
        </div>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all text-white font-semibold"
        >
          <Share2 size={18} />
          Share
        </button>
      </div>

      {/* Main Video Area */}
      <div className="flex-grow flex items-center justify-center p-6 overflow-hidden">
        <div className={`grid gap-4 w-full h-full max-h-full items-center justify-center content-center ${gridClass}`}>
          {/* Local Video */}
          <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-md text-sm backdrop-blur-md">
              You
            </div>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <div key={id} className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
              <RemoteVideo stream={stream} />
              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-md text-sm backdrop-blur-md">
                Participant {id.substring(0, 4)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-8 flex justify-center items-center gap-6 bg-zinc-950 border-t border-zinc-900">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition ${isMicOn ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition ${isCamOn ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}
        >
          {isCamOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={leaveMeeting}
          className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all hover:scale-110 active:scale-90"
        >
          <PhoneOff size={24} fill="currentColor" />
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl border border-zinc-800">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Share Meeting</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Invitation Link */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm mb-2">Invitation Link</p>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={getInvitationLink()}
                  readOnly
                  className="flex-1 bg-zinc-700 text-sm text-blue-400 px-3 py-2 rounded border border-zinc-600 focus:outline-none font-mono truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="text-zinc-400 hover:text-white transition p-2"
                >
                  {copied ? (
                    <Check size={20} className="text-green-400" />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
              <p className="text-sm text-green-300">
                ✓ Users can click this link to join directly without needing to enter the password.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Copy size={20} />
                {copied ? "Link Copied!" : "Copy Link"}
              </button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={shareViaWeb}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share via...
                </button>
              )}

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}