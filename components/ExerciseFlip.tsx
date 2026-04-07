'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { frameUrls } from '@/lib/workouts';

export function ExerciseFlip({ dbId, label }: { dbId: string; label: string }) {
  const [u0, u1] = frameUrls(dbId);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => 1 - f), 880);
    return () => window.clearInterval(id);
  }, [dbId]);

  const src = frame === 0 ? u0 : u1;

  return (
    <div className="exercise-media">
      <Image src={src} alt={`${label} demonstration`} fill sizes="140px" priority={false} />
      <span className="frame-tag" aria-hidden>
        A · B
      </span>
    </div>
  );
}
