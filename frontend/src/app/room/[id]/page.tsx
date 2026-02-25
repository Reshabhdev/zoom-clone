"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Share2, Copy, Check, X } from "lucide-react";

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id;
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Build the invitation link (you'll need to get invitation_token from backend)
  const getInvitationLink = () => {
    // For now, using meeting ID - in production, you'd get the invitation_token from the meeting creation
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/join/${roomId}`;
  };

  useEffect(() => {
    async function startMeeting() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }
    startMeeting();

    // Cleanup when leaving the room
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

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
      <div className="flex-grow flex items-center justify-center p-6 gap-4">
        <div className="relative w-full max-w-3xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
          <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-md text-sm backdrop-blur-md">
            You (Local)
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-8 flex justify-center items-center gap-6 bg-zinc-950 border-t border-zinc-900">
        <button 
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-4 rounded-full transition ${isMicOn ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        <button 
          onClick={() => setIsCamOn(!isCamOn)}
          className={`p-4 rounded-full transition ${isCamOn ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-500'}`}
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
              
              {navigator.share && (
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