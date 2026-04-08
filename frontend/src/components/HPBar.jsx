import React from 'react';
import { FACTIONS } from '../context/GameContext';

export default function HPBar({ factions }) {
  if (!factions) return null;

  return (
    <div className="hp-bars-container">
      {Object.values(factions).map((f) => {
        const info = FACTIONS[f.id];
        const pct = Math.max(0, (f.hp / f.maxHp) * 100);
        const isLow = pct < 30;
        const isCritical = pct < 10;

        return (
          <div key={f.id} className="hp-bar-item" style={{ '--color': info.color }}>
            <div className="hp-bar-header">
              <span className="hp-faction-emoji">{info.emoji}</span>
              <span className="hp-faction-name">{info.name}</span>
              <span className={`hp-value ${isCritical ? 'critical' : isLow ? 'low' : ''}`}>
                {Math.round(f.hp)}/{f.maxHp}
              </span>
            </div>
            <div className="hp-track">
              <div
                className={`hp-fill ${isCritical ? 'hp-critical' : isLow ? 'hp-low' : ''}`}
                style={{ width: `${pct}%`, background: info.color }}
              />
              {isCritical && <span className="hp-danger-label">⚠️ 危機！</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
