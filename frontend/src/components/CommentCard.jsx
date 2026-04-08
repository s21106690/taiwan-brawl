import React, { useState } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

export default function CommentCard({ comment }) {
  const { voteComment, user } = useGame();
  const [voted, setVoted] = useState(null);
  const fInfo = FACTIONS[comment.faction];

  const handleVote = (type) => {
    if (voted) return;
    setVoted(type);
    voteComment(comment.id, type);
  };

  const netScore = comment.likes - comment.dislikes;

  return (
    <div
      className={`comment-card ${comment.isCritical ? 'comment-critical' : ''}`}
      style={{ '--faction-color': fInfo?.color || '#888' }}
    >
      <div className="comment-header">
        <div className="comment-user">
          <span className="comment-emoji">{fInfo?.emoji}</span>
          <span className="comment-username">{comment.username}</span>
          <span className="comment-faction-tag" style={{ background: fInfo?.color }}>
            {fInfo?.name}
          </span>
          {comment.isCritical && (
            <span className="critical-badge">💥 暴擊留言</span>
          )}
        </div>
        <span className="comment-time">
          {new Date(comment.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <p className="comment-text">{comment.text}</p>

      <div className="comment-actions">
        <button
          className={`vote-btn like-btn ${voted === 'like' ? 'voted' : ''}`}
          onClick={() => handleVote('like')}
          disabled={!!voted}
          title="讚→對敵方造成傷害"
        >
          👍 <span>{comment.likes}</span>
        </button>
        <button
          className={`vote-btn dislike-btn ${voted === 'dislike' ? 'voted' : ''}`}
          onClick={() => handleVote('dislike')}
          disabled={!!voted}
          title="倒讚→對己方造成友傷"
        >
          👎 <span>{comment.dislikes}</span>
        </button>
        <span className={`net-score ${netScore > 0 ? 'positive' : netScore < 0 ? 'negative' : ''}`}>
          {netScore > 0 ? '+' : ''}{netScore}
        </span>
      </div>
    </div>
  );
}
