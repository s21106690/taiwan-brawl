import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';

const GameContext = createContext(null);

export const FACTIONS = {
  north: { id: 'north', name: '天龍北', emoji: '🐉', color: '#4f46e5', bg: '#eef2ff' },
  central: { id: 'central', name: '慶記中', emoji: '🦁', color: '#dc2626', bg: '#fef2f2' },
  south: { id: 'south', name: '暖男南', emoji: '🌊', color: '#0891b2', bg: '#ecfeff' },
  east: { id: 'east', name: '好山東', emoji: '🏔️', color: '#16a34a', bg: '#f0fdf4' },
  island: { id: 'island', name: '外島幫', emoji: '🏝️', color: '#d97706', bg: '#fffbeb' },
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
  const [page, setPage] = useState('landing'); // landing | select | arena | chat | tribunal

  const addNotification = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const listenersRef = useRef(false);

  useEffect(() => {
    // 防止重複綁定
    if (listenersRef.current) return;
    listenersRef.current = true;

    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onGameState = (state) => {
      setFactions(state.factions);
      setCurrentTopic(state.currentTopic);
      setComments(state.comments || []);
      if (state.user) setUser(state.user);
    };

    const onCommentNew = (comment) => {
      setComments(prev => {
        if (prev.some(c => c.id === comment.id)) return prev; // 防重複
        return [...prev.slice(-199), comment];
      });
    };

    const onCommentUpdated = (updated) => {
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const onFactionsUpdated = (updated) => setFactions(updated);

    const onBattleCritical = ({ comment, damage, attacker, factions: updatedFactions }) => {
      setFactions(updatedFactions);
      setCriticalHit({ comment, damage, attacker });
      setTimeout(() => setCriticalHit(null), 3000);
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
      addNotification(message, 'error');
    };

    const onPrisonAnnounce = ({ username, faction }) => {
      addNotification(`🐢 ${username}（${faction.name}）被關進太平洋戰俘營！`, 'warning');
    };

    const onUserJoined = ({ username, faction }) => {
      addNotification(`${faction.emoji} ${username} 加入了 ${faction.name}！`, 'info');
    };

    const onBattleReset = (state) => {
      setFactions(state.factions);
      setCurrentTopic(state.currentTopic);
      setComments([]);
      addNotification('🔔 新的一天！烽火台重置！開始新的戰役！', 'success');
    };

    const onError = ({ message }) => addNotification(message, 'error');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game:state', onGameState);
    socket.on('comment:new', onCommentNew);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('factions:updated', onFactionsUpdated);
    socket.on('battle:critical', onBattleCritical);
    socket.on('barrage:fire', onBarrageFire);
    socket.on('faction:message', onFactionMessage);
    socket.on('prison:enter', onPrisonEnter);
    socket.on('prison:announce', onPrisonAnnounce);
    socket.on('user:joined', onUserJoined);
    socket.on('battle:reset', onBattleReset);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game:state', onGameState);
      socket.off('comment:new', onCommentNew);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('factions:updated', onFactionsUpdated);
      socket.off('battle:critical', onBattleCritical);
      socket.off('barrage:fire', onBarrageFire);
      socket.off('faction:message', onFactionMessage);
      socket.off('prison:enter', onPrisonEnter);
      socket.off('prison:announce', onPrisonAnnounce);
      socket.off('user:joined', onUserJoined);
      socket.off('battle:reset', onBattleReset);
      socket.off('error', onError);
      listenersRef.current = false;
    };
  }, [addNotification]);

  const joinGame = useCallback((username, faction) => {
    const userData = { username, faction };
    socket.emit('user:join', userData);
    setUser({ username, faction, isPrisoner: false });
    setPage('arena');
  }, []);

  const postComment = useCallback((text) => {
    socket.emit('comment:post', { text });
  }, []);

  const voteComment = useCallback((commentId, vote) => {
    socket.emit('comment:vote', { commentId, vote });
  }, []);

  const sendFactionMessage = useCallback((message) => {
    socket.emit('faction:chat', { message });
  }, []);

  return (
    <GameContext.Provider value={{
      user, factions, currentTopic, comments, barrages,
      factionMessages, notifications, isPrisoner, connected,
      criticalHit, page, setPage,
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
