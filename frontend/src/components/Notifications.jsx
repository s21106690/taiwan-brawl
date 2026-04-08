import React from 'react';
import { useGame } from '../context/GameContext';

export default function Notifications() {
  const { notifications } = useGame();

  return (
    <div className="notifications-container">
      {notifications.map(n => (
        <div key={n.id} className={`notification notification-${n.type}`}>
          {n.msg}
        </div>
      ))}
    </div>
  );
}
