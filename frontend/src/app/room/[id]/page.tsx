"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Share2 } from "lucide-react";
import { useWebRTC } from "./useWebRTC";
import { RemoteVideo } from "./RemoteVideo";
import { ShareModal } from "./ShareModal";

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [showShareModal, setShowShareModal] = useState(false);

  const {
    localVideoRef,
    isMicOn,
    isCamOn,
    remoteStreams,
    toggleMic,
    toggleCam,
    streamRef
  } = useWebRTC(roomId);

  const leaveMeeting = () => {
    router.push("/");
  };

  const getInvitationLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/join/${roomId}`;
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
    <div className="flex flex-col h-[calc(100vh-74px)] bg-black text-white">
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
          disabled={!streamRef.current || streamRef.current.getAudioTracks().length === 0}
          className={`p-4 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${isMicOn ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleCam}
          disabled={!streamRef.current || streamRef.current.getVideoTracks().length === 0}
          className={`p-4 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${isCamOn ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}
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

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        invitationLink={getInvitationLink()}
      />
    </div>
  );
}