"use client";
// 1. We imported useAuth here
import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, VideoOff, ArrowRight, Plus, Monitor, Copy, Check, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface MeetingCreated {
  meeting_id: string;
  title: string;
  password: string;
  invitation_token: string;
  created_at: string;
}

export default function Lobby() {
  const { isLoaded, isSignedIn, user } = useUser();
  // 2. We extract the getToken function from Clerk
  const { getToken } = useAuth(); 
  
  const router = useRouter();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMeetingCreated, setShowMeetingCreated] = useState(false);
  const [meetingData, setMeetingData] = useState<MeetingCreated | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wait for Clerk to load auth state
  if (!isLoaded || !isSignedIn) return null;

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
      // Grab a fresh token from Clerk and pass it directly
      const token = await getToken();
      if (token) {
        localStorage.setItem("token", token);
      }

      await apiFetch("/meetings/join", {
        method: "POST",
        body: JSON.stringify({ meeting_id: meetingId, password: "" })
      }, token);
      
      router.push(`/room/${meetingId}`);
    } catch (err: any) {
      alert(err.message || "Failed to join. Make sure the ID is correct and backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      // Grab a fresh token from Clerk and pass it directly
      const token = await getToken();
      if (token) {
        localStorage.setItem("token", token);
      }

      const data = await apiFetch("/meetings/create", {
        method: "POST",
        body: JSON.stringify({ title: "Instant Meeting" })
      }, token);
      
      setMeetingData(data);
      setShowMeetingCreated(true);
    } catch (err: any) {
      alert("Failed to create meeting: " + err.message);
    }
  };

  const generateInvitationLink = () => {
    if (!meetingData) return "";
    // Frontend base URL - adjust this based on your deployment
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/join/${meetingData.invitation_token}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleEnterMeeting = async () => {
    if (!meetingData) return;
    router.push(`/room/${meetingData.meeting_id}`);
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

          <button
            onClick={toggleCamera}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${
              isCameraOn
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Camera size={20} />
            {isCameraOn ? 'Camera ON' : 'Camera OFF'}
          </button>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to join?
            </h1>
            <p className="text-slate-400 text-lg">
              Enter a meeting code or create a new one to get started.
            </p>
          </div>

          {/* Create Meeting Button */}
          <button
            onClick={handleCreateMeeting}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
          >
            <Plus size={24} />
            Create a Meeting
          </button>

          {/* Join Meeting Section */}
          <div className="space-y-3 mt-8">
            <label className="block text-slate-300 font-semibold">
              Enter Meeting ID
            </label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="abc-def-ghi"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleJoin}
              disabled={loading || !meetingId}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <ArrowRight size={20} />
              Join Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Meeting Created Modal */}
      {showMeetingCreated && meetingData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl border border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Meeting Created!</h2>
              <button
                onClick={() => setShowMeetingCreated(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4">
              {/* Meeting ID */}
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Meeting ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-bold text-blue-400">
                    {meetingData.meeting_id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(meetingData.meeting_id, "meeting_id")}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {copiedField === "meeting_id" ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Room Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-bold text-green-400">
                    {meetingData.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(meetingData.password, "password")}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {copiedField === "password" ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Invitation Link */}
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Invitation Link</p>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={generateInvitationLink()}
                    readOnly
                    className="flex-1 bg-slate-700 text-sm text-blue-400 px-3 py-2 rounded border border-slate-600 focus:outline-none font-mono truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(generateInvitationLink(), "link")}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {copiedField === "link" ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Share the invitation link</strong> with participants. They can join directly without entering the password separately.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => copyToClipboard(generateInvitationLink(), "share")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
              >
                Copy Invite Link
              </button>
              <button
                onClick={handleEnterMeeting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
              >
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}