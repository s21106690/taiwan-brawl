import React from 'react';
import { FACTIONS } from '../context/GameContext';

export default function CriticalHitEffect({ hit }) {
  if (!hit) return null;
  const f = FACTIONS[hit.comment.faction];

  return (
    <div className="critical-overlay">
      <div className="critical-content">
        <div className="critical-title">💥 CRITICAL HIT! 💥</div>
        <div className="critical-attacker" style={{ color: f?.color }}>
          {f?.emoji} {f?.name} 造成 <strong>{hit.damage}</strong> 點傷害！
        </div>
        <div className="critical-comment">「{hit.comment.text}」</div>
        <div className="critical-by">— {hit.comment.username}</div>
      </div>
    </div>
  );
}
