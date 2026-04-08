import React from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

export default function LiveBarrage() {
  const { barrages } = useGame();

  return (
    <div className="barrage-overlay" aria-hidden="true">
      {barrages.map((b) => {
        const f = FACTIONS[b.faction];
        return (
          <div
            key={b.id}
            className="barrage-item"
            style={{
              top: `${b.top}%`,
              color: f?.color || '#fff',
              textShadow: `0 0 10px ${f?.color || '#fff'}`,
              animationDuration: `${6 + Math.random() * 3}s`,
            }}
          >
            <span className="barrage-emoji">{f?.emoji}</span>
            <span className="barrage-user">[{b.username}]</span>
            <span className="barrage-text">{b.text}</span>
          </div>
        );
      })}
    </div>
  );
}
