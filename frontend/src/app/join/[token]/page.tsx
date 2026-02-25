"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface InvitationDetails {
  meeting_id: string;
  title: string;
  password: string;
  host_id: number;
  created_at: string;
}

export default function JoinByInvitation() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const invitationToken = params.token as string;

  const [meetingDetails, setMeetingDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningMeeting, setJoiningMeeting] = useState(false);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (token) {
          localStorage.setItem("token", token);
        }

        const details = await apiFetch(
          `/meetings/invitation/${invitationToken}`,
          { method: "GET" },
          token
        );
        setMeetingDetails(details);
      } catch (err: any) {
        setError(err.message || "Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [invitationToken, getToken]);

  const handleJoinMeeting = async () => {
    if (!meetingDetails) return;

    try {
      setJoiningMeeting(true);
      const token = await getToken();

      await apiFetch(
        "/meetings/join",
        {
          method: "POST",
          body: JSON.stringify({
            meeting_id: meetingDetails.meeting_id,
            password: meetingDetails.password,
          }),
        },
        token
      );

      // Redirect to the meeting room
      router.push(`/room/${meetingDetails.meeting_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join the meeting");
      setJoiningMeeting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-md w-full">
        {loading && (
          <div className="text-center space-y-4">
            <div className="animate-spin">
              <Lock size={48} className="text-blue-500" />
            </div>
            <p className="text-slate-400">Loading invitation details...</p>
          </div>
        )}

        {error && !loading && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold">Invitation Invalid</h2>
            <p className="text-slate-400">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Go Back Home
            </button>
          </div>
        )}

        {!loading && !error && meetingDetails && (
          <div className="bg-slate-900 rounded-2xl p-8 space-y-6 border border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h1 className="text-3xl font-bold">Join Meeting</h1>
              <p className="text-slate-400">via secure invitation link</p>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4 bg-slate-800/50 rounded-lg p-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Meeting Title</p>
                <p className="text-xl font-semibold text-white">
                  {meetingDetails.title}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Meeting ID</p>
                <p className="text-sm font-mono text-blue-400">
                  {meetingDetails.meeting_id}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Password</p>
                <p className="text-sm font-mono text-green-400 flex items-center gap-2">
                  <Lock size={16} />
                  {meetingDetails.password}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                ✓ The password will be automatically provided when you join.
                <br />
                No need to enter it manually.
              </p>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoinMeeting}
              disabled={joiningMeeting}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
            >
              {joiningMeeting ? "Joining..." : "Join Meeting Now"}
            </button>

            {/* Back Link */}
            <button
              onClick={() => router.push("/")}
              className="w-full text-center text-slate-400 hover:text-slate-300 transition text-sm"
            >
              Go back to home
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
