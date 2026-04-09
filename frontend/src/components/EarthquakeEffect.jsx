import React from 'react';
import { FACTIONS } from '../context/GameContext';

export default function EarthquakeEffect({ earthquake }) {
  if (!earthquake) return null;
  const f = FACTIONS[earthquake.faction?.id] || earthquake.faction;

  return (
    <div className="earthquake-overlay">
      <div className="earthquake-content">
        <div className="earthquake-icon">🌋</div>
        <div className="earthquake-title">地區大地震！</div>
        <div className="earthquake-faction" style={{ color: f?.color }}>
          {f?.emoji} {f?.name} 邏輯慘敗！
        </div>
        <div className="earthquake-dmg">
          一次性造成 <strong>{Math.round(earthquake.damage)}</strong> 點毀滅傷害！
        </div>
        <div className="earthquake-quote">「倒讚海嘯，無力回天！」</div>
      </div>
    </div>
  );
}
