"use client";
import { Check, Copy, Share2, X } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    invitationLink: string;
}

export const ShareModal = ({ isOpen, onClose, invitationLink }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink).then(() => {
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
                    url: invitationLink,
                });
            } catch (err) {
                console.log("Share cancelled or failed");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl border border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Share Meeting</h2>
                    <button
                        onClick={onClose}
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
                            value={invitationLink}
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
                        onClick={onClose}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
