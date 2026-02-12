"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from "lucide-react";

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id;
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

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
    </div>
  );
}