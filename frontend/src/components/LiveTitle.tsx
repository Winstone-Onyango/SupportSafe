'use client';
// React library
import React from 'react';
// Lottie-based icon player from lordicon
import { Player } from '@lordicon/react';

// The animated "live" icon JSON (lottie format)
import ICON from '../assets/liveicon.json';

// Title bar for the live-reports section, with an auto-repeating animated icon.
function LiveTitle() {
  // Ref to the lordicon Player so we can control playback
  const playerRef = React.useRef<Player>(null);

  // On mount (and whenever the ref resolves), start the animation from frame 0
  React.useEffect(() => {
    playerRef.current?.playFromBeginning();
  }, []);

  return (
    // Horizontal layout: text label + animated icon
    <div className="flex items-center gap-3">
      <h1 className="font-bold text-xl tracking-wide">Live Updates</h1>
      <div className="mt-2">
        {/* The icon loops forever by calling playFromBegininng() on every complete event */}
        <Player
          ref={playerRef}
          icon={ICON}
          onComplete={() => playerRef.current?.playFromBeginning()}
        />
      </div>
    </div>
  );
}

export default LiveTitle;
