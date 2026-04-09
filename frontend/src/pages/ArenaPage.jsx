import React, { useState, useRef, useEffect } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';
import HPBar from '../components/HPBar';
import CommentCard from '../components/CommentCard';
import LiveBarrage from '../components/LiveBarrage';
import CriticalHitEffect from '../components/CriticalHitEffect';
import EarthquakeEffect from '../components/EarthquakeEffect';

export default function ArenaPage() {
  const {
    user, factions, currentTopic, comments, postComment,
    isPrisoner, setPage, criticalHit, earthquake, dislikeInfo, victory,
  } = useGame();

  const [inputText, setInputText] = useState('');
  const commentsEndRef = useRef(null);
  const fInfo = user ? FACTIONS[user.faction] : null;
  const myFaction = factions?.[user?.faction];
  const isFallen = myFaction?.fallen;
  const isEnded = !!victory;

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handlePost = () => {
    if (!inputText.trim() || isPrisoner || isFallen || isEnded) return;
    postComment(inputText.trim());
    setInputText('');
  };

  const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp).slice(-80);

  const canPost = !isPrisoner && !isFallen && !isEnded;

  return (
    <div className="arena-page">
      <LiveBarrage />
      {criticalHit && <CriticalHitEffect hit={criticalHit} />}
      {earthquake && <EarthquakeEffect earthquake={earthquake} />}

      {/* 頂部導覽 */}
      <nav className="arena-nav">
        <div className="nav-left">
          <span className="nav-logo">⚔️ 寶島大亂鬥</span>
          {fInfo && (
            <div className="nav-faction" style={{ color: fInfo.color }}>
              {fInfo.emoji} {fInfo.name}
              {isFallen && <span className="nav-fallen-badge"> 💀淪陷</span>}
            </div>
          )}
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => setPage('chat')}>💬 同溫層</button>
          <button className="nav-btn" onClick={() => setPage('tribunal')}>📊 每週戰報</button>
          <button className="nav-btn" onClick={() => setPage('rulebook')}>📖 規則書</button>
        </div>
      </nav>

      <div className="arena-layout">
        {/* 左欄：血條 */}
        <aside className="arena-sidebar">
          <h3 className="sidebar-title">⚔️ 戰況血條</h3>
          <HPBar factions={factions} />

          <div className="topic-box">
            <div className="topic-label">🔥 今日引戰題</div>
            <div className="topic-text">{currentTopic}</div>
          </div>

          {/* 重拳額度 */}
          <div className="dislike-quota-box">
            <div className="quota-label">💢 重拳倒讚額度</div>
            <div className="quota-bar">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`quota-pip ${i < dislikeInfo.remaining ? 'quota-pip-active' : ''}`}
                />
              ))}
            </div>
            <div className="quota-text">
              {dislikeInfo.remaining > 0
                ? `剩餘 ${dislikeInfo.remaining} 次重拳（每小時補滿）`
                : '重拳已用盡！改以普通傷害攻擊'}
            </div>
          </div>

          <div className="rules-box">
            <div className="rules-title">📜 戰場規則</div>
            <ul className="rules-list">
              <li>👎 倒讚 → 攻擊對方陣營</li>
              <li>💢 重拳（×10/h）→ 8 傷害</li>
              <li>🎯 集火 3 人 → ×1.5 傷害</li>
              <li>🌋 3 倍倒讚 → 地區大地震</li>
              <li>👍 同陣營按讚 → 回血</li>
              <li>💀 血量歸零 → 淪陷觀戰</li>
            </ul>
          </div>
        </aside>

        {/* 中央：留言區 */}
        <main className="arena-main">
          <div className="comments-header">
            <h2>🩸 戰場留言區</h2>
            <span className="comment-count">{comments.length} 則發言</span>
          </div>

          {/* 勝利/淪陷橫幅 */}
          {isEnded && (
            <div className="victory-banner" style={{ '--wc': FACTIONS[victory.winner?.id]?.color }}>
              🏆 {victory.winner?.emoji} {victory.winner?.name} 奪得台灣之霸！慶功模式進行中...
            </div>
          )}
          {isFallen && !isEnded && (
            <div className="fallen-banner">
              💀 你的陣營已淪陷！進入觀戰模式，只能按讚/倒讚
            </div>
          )}

          <div className="comments-feed">
            {sortedComments.length === 0 ? (
              <div className="no-comments">
                <p>戰場一片寂靜...</p>
                <p>成為第一個開戰的勇士！</p>
              </div>
            ) : (
              sortedComments.map(c => <CommentCard key={c.id} comment={c} />)
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* 輸入區 */}
          <div className="comment-input-area">
            {!canPost ? (
              <div className="prisoner-notice">
                {isPrisoner && '🐢 你在太平洋戰俘營服刑中，暫時無法發言！（24 小時後解除）'}
                {isFallen && !isPrisoner && '💀 你的陣營已淪陷！只能觀戰。'}
                {isEnded && !isFallen && !isPrisoner && '🏆 戰役已結束，等待下一輪開戰！'}
              </div>
            ) : (
              <div className="input-row">
                {fInfo && (
                  <span className="input-faction-badge" style={{ background: fInfo.color }}>
                    {fInfo.emoji} {fInfo.name}
                  </span>
                )}
                <input
                  className="comment-input"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePost()}
                  placeholder="輸入你的戰狼發言... (Enter 發送)"
                  maxLength={140}
                />
                <button className="post-btn" onClick={handlePost} disabled={!inputText.trim()}>
                  ⚔️ 出戰
                </button>
              </div>
            )}
            <div className="input-hint">
              {inputText.length}/140 字 ・ 👎 倒讚敵方留言造成傷害！👍 按讚己方留言回血！
            </div>
          </div>
        </main>

        {/* 右欄：熱門留言 + 台灣地圖 */}
        <aside className="arena-right">
          <h3 className="sidebar-title">🌋 最高傷害留言</h3>
          <div className="top-comments">
            {[...comments]
              .sort((a, b) => b.dislikes - a.dislikes || b.timestamp - a.timestamp)
              .slice(0, 5)
              .map((c, i) => {
                const f = FACTIONS[c.faction];
                return (
                  <div key={c.id} className="top-comment-item">
                    <span className="top-rank">#{i + 1}</span>
                    <span className="top-emoji">{f?.emoji}</span>
                    <div className="top-content">
                      <div className="top-user">{c.username}</div>
                      <div className="top-text">{c.text.slice(0, 36)}{c.text.length > 36 ? '...' : ''}</div>
                    </div>
                    <span className="top-likes" style={{ color: '#ef4444' }}>👎{c.dislikes}</span>
                  </div>
                );
              })
            }
            {comments.length === 0 && <p className="no-top">還沒有留言，快去開戰！</p>}
          </div>
        </aside>
      </div>

      {/* 手機底部導覽列 */}
      <nav className="mobile-bottom-nav">
        <button className="mobile-nav-btn active">
          <span className="mobile-nav-icon">⚔️</span>戰場
        </button>
        <button className="mobile-nav-btn" onClick={() => setPage('chat')}>
          <span className="mobile-nav-icon">💬</span>同溫層
        </button>
        <button className="mobile-nav-btn" onClick={() => setPage('tribunal')}>
          <span className="mobile-nav-icon">📊</span>戰報
        </button>
        <button className="mobile-nav-btn" onClick={() => setPage('rulebook')}>
          <span className="mobile-nav-icon">📖</span>規則書
        </button>
      </nav>
    </div>
  );
}
