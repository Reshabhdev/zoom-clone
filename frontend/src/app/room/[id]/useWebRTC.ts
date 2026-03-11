import { useEffect, useRef, useState } from "react";

const getIceServers = (): RTCConfiguration => {
    const iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
    ];

    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnUrl && turnUsername && turnCredential) {
        iceServers.push({
            urls: turnUrl,
            username: turnUsername,
            credential: turnCredential,
        });
    } else {
        // Fallback to OpenRelay Project free TURN server if no env variables are provided
        iceServers.push({
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        });
        iceServers.push({
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        });
        iceServers.push({
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        });
    }

    return { iceServers };
};

export const useWebRTC = (roomId: string) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});

    const streamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const pendingCandidates = useRef<{ [key: string]: RTCIceCandidateInit[] }>({});
    const wsRef = useRef<WebSocket | null>(null);
    const localUserId = useRef(Math.random().toString(36).substring(7)).current;

    useEffect(() => {
        let mounted = true;

        const initMeeting = async () => {
            let stream: MediaStream | null = null;
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    if (!mounted) {
                        // If the component unmounted while waiting for media, stop the tracks right away
                        stream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    streamRef.current = stream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } else {
                    console.warn("navigator.mediaDevices not available. Are you on HTTP?");
                }
            } catch (err) {
                if (mounted) {
                    console.error("Error accessing media devices:", err);
                }
            }

            if (!mounted) return;

            try {
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
                    `${protocol}//${window.location.hostname}:8000/ws/${roomId}`;

                wsRef.current = new WebSocket(wsUrl);

                wsRef.current.onopen = () => {
                    wsRef.current?.send(JSON.stringify({ type: "join", senderId: localUserId }));
                };

                wsRef.current.onmessage = async (event) => {
                    if (!mounted) return;
                    const data = JSON.parse(event.data);

                    if (data.targetId && data.targetId !== localUserId) return;

                    switch (data.type) {
                        case "join":
                            console.log("Received JOIN from", data.senderId);
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
                            console.log("Received OFFER from", data.senderId);
                            const existingPc = peersRef.current[data.senderId];
                            const collision = existingPc && existingPc.signalingState !== "stable";
                            const polite = localUserId < data.senderId;

                            if (collision && !polite) {
                                console.log("Ignoring collision from", data.senderId);
                                return;
                            }

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

                            if (pendingCandidates.current[data.senderId]) {
                                console.log("Processing pending ice candidates for", data.senderId);
                                for (const candidate of pendingCandidates.current[data.senderId]) {
                                    try {
                                        await pcReceive.addIceCandidate(new RTCIceCandidate(candidate));
                                    } catch (e) {
                                        console.error("Error adding queued ice candidate", e);
                                    }
                                }
                                delete pendingCandidates.current[data.senderId];
                            }
                            break;

                        case "answer":
                            console.log("Received ANSWER from", data.senderId);
                            if (peersRef.current[data.senderId]) {
                                const pcAns = peersRef.current[data.senderId];
                                await pcAns.setRemoteDescription(new RTCSessionDescription(data.sdp));

                                if (pendingCandidates.current[data.senderId]) {
                                    console.log("Processing pending ice candidates for", data.senderId);
                                    for (const candidate of pendingCandidates.current[data.senderId]) {
                                        try {
                                            await pcAns.addIceCandidate(new RTCIceCandidate(candidate));
                                        } catch (e) {
                                            console.error("Error adding queued ice candidate", e);
                                        }
                                    }
                                    delete pendingCandidates.current[data.senderId];
                                }
                            }
                            break;

                        case "ice-candidate":
                            if (data.candidate) {
                                if (peersRef.current[data.senderId]) {
                                    const pcIce = peersRef.current[data.senderId];
                                    if (pcIce.remoteDescription && pcIce.remoteDescription.type) {
                                        try {
                                            await pcIce.addIceCandidate(new RTCIceCandidate(data.candidate));
                                        } catch (e) {
                                            console.error("Error adding ice candidate", e);
                                        }
                                    } else {
                                        if (!pendingCandidates.current[data.senderId]) {
                                            pendingCandidates.current[data.senderId] = [];
                                        }
                                        pendingCandidates.current[data.senderId].push(data.candidate);
                                    }
                                } else {
                                    if (!pendingCandidates.current[data.senderId]) {
                                        pendingCandidates.current[data.senderId] = [];
                                    }
                                    pendingCandidates.current[data.senderId].push(data.candidate);
                                }
                            }
                            break;
                    }
                };

            } catch (err) {
                if (mounted) console.error("Error accessing media devices or connecting WebRTC:", err);
            }
        };

        initMeeting();

        return () => {
            mounted = false;
            streamRef.current?.getTracks().forEach(track => track.stop());
            wsRef.current?.close();
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, [roomId, localUserId]);

    const createPeerConnection = (partnerId: string, stream: MediaStream | null) => {
        if (peersRef.current[partnerId]) {
            peersRef.current[partnerId].close();
        }
        const pc = new RTCPeerConnection(getIceServers());
        peersRef.current[partnerId] = pc;

        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });
        }

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
        if (streamRef.current && streamRef.current.getAudioTracks().length > 0) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isMicOn;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCam = () => {
        if (streamRef.current && streamRef.current.getVideoTracks().length > 0) {
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !isCamOn;
            });
            setIsCamOn(!isCamOn);
        }
    };

    return {
        localVideoRef,
        isMicOn,
        isCamOn,
        remoteStreams,
        toggleMic,
        toggleCam,
        streamRef
    };
};
