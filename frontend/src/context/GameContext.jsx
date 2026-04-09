import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';

const GameContext = createContext(null);

export const FACTIONS = {
  north:   { id: 'north',   name: '天龍北', emoji: '🐉', color: '#4f46e5', bg: '#eef2ff' },
  central: { id: 'central', name: '慶記中', emoji: '🦁', color: '#dc2626', bg: '#fef2f2' },
  south:   { id: 'south',   name: '暖男南', emoji: '🌊', color: '#0891b2', bg: '#ecfeff' },
  east:    { id: 'east',    name: '好山東', emoji: '🏔️', color: '#16a34a', bg: '#f0fdf4' },
  island:  { id: 'island',  name: '外島幫', emoji: '🏝️', color: '#d97706', bg: '#fffbeb' },
};

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [factions, setFactions] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [comments, setComments] = useState([]);
  const [barrages, setBarrages] = useState([]);
  const [factionMessages, setFactionMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isPrisoner, setIsPrisoner] = useState(false);
  const [connected, setConnected] = useState(false);
  const [criticalHit, setCriticalHit] = useState(null);
  const [earthquake, setEarthquake] = useState(null);
  const [focusFire, setFocusFire] = useState(null);
  const [victory, setVictory] = useState(null);           // { winner, champion, heroHall, celebrationEndsAt }
  const [heroHall, setHeroHall] = useState([]);
  const [dislikeInfo, setDislikeInfo] = useState({ remaining: 10, isHeavy: true });
  const [page, setPage] = useState('landing');

  const addNotification = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const addNotificationRef = useRef(addNotification);
  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);

  useEffect(() => {
    socket.connect();

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onGameState = (state) => {
      setFactions(state.factions);
      setCurrentTopic(state.currentTopic);
      setComments(state.comments || []);
      if (state.user) setUser(state.user);
      if (state.heroHall) setHeroHall(state.heroHall);
      if (state.victoryAnnounced && state.winner) {
        setVictory({ winner: state.winner, celebrationEndsAt: state.celebrationEndsAt, heroHall: state.heroHall });
      }
    };

    const onCommentNew = (comment) => {
      setComments(prev => {
        if (prev.some(c => c.id === comment.id)) return prev;
        return [...prev.slice(-199), comment];
      });
    };

    const onCommentUpdated = (updated) => {
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const onFactionsUpdated = (updated) => setFactions(updated);

    const onBattleCritical = ({ comment, bonus, attacker, factions: f }) => {
      if (f) setFactions(f);
      setCriticalHit({ comment, bonus, attacker });
      setTimeout(() => setCriticalHit(null), 3000);
    };

    const onBattleEarthquake = ({ comment, damage, faction, factions: f }) => {
      if (f) setFactions(f);
      setEarthquake({ comment, damage, faction });
      addNotificationRef.current(`🌋 地區大地震！${faction.name} 受到 ${Math.round(damage)} 點毀滅傷害！`, 'error');
      setTimeout(() => setEarthquake(null), 4000);
    };

    const onBattleFocus = ({ username, faction, multiplier }) => {
      setFocusFire({ username, faction, multiplier });
      addNotificationRef.current(`🎯 集火攻擊！${faction.name}「${username}」被圍毆，傷害 ×${multiplier}！`, 'warning');
      setTimeout(() => setFocusFire(null), 3000);
    };

    const onFactionFallen = ({ faction }) => {
      addNotificationRef.current(`💀 ${faction.emoji} ${faction.name} 已淪陷！進入觀戰模式！`, 'error');
    };

    const onBattleVictory = (data) => {
      setVictory(data);
      setHeroHall(data.heroHall || []);
      addNotificationRef.current(`🏆 ${data.winner.emoji} ${data.winner.name} 奪得台灣之霸！`, 'success');
    };

    const onBattleReset = (state) => {
      setFactions(state.factions);
      setCurrentTopic(state.currentTopic);
      setComments([]);
      setVictory(null);
      if (state.heroHall) setHeroHall(state.heroHall);
      addNotificationRef.current('🔔 新的一輪開始！', 'success');
    };

    const onBarrageFire = (barrage) => {
      const id = Date.now() + Math.random();
      setBarrages(prev => [...prev, { ...barrage, id, top: Math.random() * 70 + 10 }]);
      setTimeout(() => setBarrages(prev => prev.filter(b => b.id !== id)), 8000);
    };

    const onFactionMessage = (msg) => {
      setFactionMessages(prev => [...prev.slice(-99), msg]);
    };

    const onPrisonEnter = ({ message }) => {
      setIsPrisoner(true);
      addNotificationRef.current(message, 'error');
    };

    const onPrisonAnnounce = ({ username, faction }) => {
      addNotificationRef.current(`🐢 ${username}（${faction.name}）被關進太平洋戰俘營！`, 'warning');
    };

    const onUserJoined = ({ username, faction }) => {
      addNotificationRef.current(`${faction.emoji} ${username} 加入了 ${faction.name}！`, 'info');
    };

    const onVoteInfo = ({ remaining, isHeavy }) => {
      setDislikeInfo({ remaining, isHeavy });
    };

    const onVoteTraitor = ({ message }) => {
      addNotificationRef.current(message, 'warning');
    };

    const onError = ({ message }) => addNotificationRef.current(message, 'error');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game:state', onGameState);
    socket.on('comment:new', onCommentNew);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('factions:updated', onFactionsUpdated);
    socket.on('battle:critical', onBattleCritical);
    socket.on('battle:earthquake', onBattleEarthquake);
    socket.on('battle:focus', onBattleFocus);
    socket.on('battle:victory', onBattleVictory);
    socket.on('battle:reset', onBattleReset);
    socket.on('faction:fallen', onFactionFallen);
    socket.on('barrage:fire', onBarrageFire);
    socket.on('faction:message', onFactionMessage);
    socket.on('prison:enter', onPrisonEnter);
    socket.on('prison:announce', onPrisonAnnounce);
    socket.on('user:joined', onUserJoined);
    socket.on('vote:info', onVoteInfo);
    socket.on('vote:traitor', onVoteTraitor);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game:state', onGameState);
      socket.off('comment:new', onCommentNew);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('factions:updated', onFactionsUpdated);
      socket.off('battle:critical', onBattleCritical);
      socket.off('battle:earthquake', onBattleEarthquake);
      socket.off('battle:focus', onBattleFocus);
      socket.off('battle:victory', onBattleVictory);
      socket.off('battle:reset', onBattleReset);
      socket.off('faction:fallen', onFactionFallen);
      socket.off('barrage:fire', onBarrageFire);
      socket.off('faction:message', onFactionMessage);
      socket.off('prison:enter', onPrisonEnter);
      socket.off('prison:announce', onPrisonAnnounce);
      socket.off('user:joined', onUserJoined);
      socket.off('vote:info', onVoteInfo);
      socket.off('vote:traitor', onVoteTraitor);
      socket.off('error', onError);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinGame = useCallback((username, faction) => {
    socket.emit('user:join', { username, faction });
    setUser({ username, faction, isPrisoner: false });
    setPage('arena');
  }, []);

  const postComment  = useCallback((text) => socket.emit('comment:post', { text }), []);
  const voteComment  = useCallback((commentId, vote) => socket.emit('comment:vote', { commentId, vote }), []);
  const sendFactionMessage = useCallback((message) => socket.emit('faction:chat', { message }), []);

  return (
    <GameContext.Provider value={{
      user, factions, currentTopic, comments, barrages,
      factionMessages, notifications, isPrisoner, connected,
      criticalHit, earthquake, focusFire, victory, heroHall,
      dislikeInfo, page, setPage,
      joinGame, postComment, voteComment, sendFactionMessage,
      FACTIONS,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
