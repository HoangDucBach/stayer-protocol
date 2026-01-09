import { useState, useRef, useEffect } from "react";

export default function BackgroundVideo() {
  const [showLoop, setShowLoop] = useState(false);
  const loopRef = useRef<HTMLVideoElement>(null);

  // Preload loop video
  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.load(); // forces preloading
    }
  }, []);

  // Play loop as soon as intro ends
  useEffect(() => {
    if (showLoop && loopRef.current) {
      loopRef.current
        .play()
        .catch(() => console.log("Autoplay blocked, muted required"));
    }
  }, [showLoop]);

  return (
    <>
      <video
        autoPlay
        muted
        playsInline
        onEnded={() => setShowLoop(true)}
        src="/assets/bg.mp4"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
          opacity: showLoop ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
          pointerEvents: "none",
        }}
      />

      <video
        ref={loopRef}
        muted
        loop
        playsInline
        src="/assets/bgloop.mp4"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
          opacity: showLoop ? 1 : 0,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
