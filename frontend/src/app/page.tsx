"use client";
// 1. We imported useAuth here
import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, VideoOff, ArrowRight, Plus, Monitor } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function Lobby() {
  const { isLoaded, isSignedIn, user } = useUser();
  // 2. We extract the getToken function from Clerk
  const { getToken } = useAuth(); 
  
  const router = useRouter();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wait for Clerk to load auth state
  if (!isLoaded || !isSignedIn) return null;

  // Store the token in localStorage whenever user is signed in
  if (isSignedIn) {
    getToken().then((token) => {
      if (token) {
        localStorage.setItem("token", token);
      }
    }).catch((err) => {
      console.error("Error getting token from Clerk:", err);
    });
  }

  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        alert("Camera access denied. Please check your browser permissions.");
      }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
    }
  };

  const handleJoin = async () => {
    if (!meetingId) return alert("Please enter a Meeting ID");
    
    setLoading(true);
    try {
      // 3. Grab the token and store it in localStorage
      const token = await getToken();
      if (token) {
        localStorage.setItem("token", token);
      }

      await apiFetch("/meetings/join", {
        method: "POST",
        body: JSON.stringify({ meeting_id: meetingId })
      });
      
      router.push(`/room/${meetingId}`);
    } catch (err: any) {
      alert(err.message || "Failed to join. Make sure the ID is correct and backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      // 5. Grab the token and store it in localStorage
      const token = await getToken();
      if (token) {
        localStorage.setItem("token", token);
      }

      const data = await apiFetch("/meetings/create", {
        method: "POST",
        body: JSON.stringify({ title: "Instant Meeting" })
      });
      router.push(`/room/${data.meeting_id}`);
    } catch (err: any) {
      alert("Failed to create meeting: " + err.message);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Video Preview */}
        <div className="flex flex-col space-y-6">
          <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <VideoOff size={48} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">Your camera is turned off</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={toggleCamera}
              className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold transition-all ${
                isCameraOn 
                ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' 
                : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20'
              }`}
            >
              {isCameraOn ? <Camera size={20} /> : <VideoOff size={20} />}
              {isCameraOn ? "Camera is On" : "Turn on Camera"}
            </button>
          </div>
        </div>

        {/* Right Side: Meeting Controls */}
        <div className="flex flex-col space-y-10">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Hello, {user?.firstName}!
            </h1>
            <p className="text-slate-400 text-xl max-w-md">
              Enter a code to join a meeting, or start a new one instantly.
            </p>
          </div>

          <div className="space-y-4 max-w-sm">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-lg transition"
              />
              <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            </div>

            <button 
              onClick={handleJoin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              {loading ? "Verifying..." : "Join Meeting"} <ArrowRight size={20} />
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-grow h-px bg-slate-800"></div>
              <span className="text-slate-600 text-sm font-bold uppercase tracking-widest">or</span>
              <div className="flex-grow h-px bg-slate-800"></div>
            </div>

            <button 
              onClick={handleCreateMeeting}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-4 rounded-xl font-bold text-lg transition"
            >
              <Plus size={20} /> New Meeting
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}