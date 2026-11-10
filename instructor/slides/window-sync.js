"use strict";
// Same-origin, same-profile window messaging only. No server, keys or timer persistence.
globalThis.OdysseySync = {
  version: 1,
  channelName: 'agent-odyssey-presenter-v1',
  connect(role) {
    if (typeof BroadcastChannel === 'undefined') return null;
    const peer = globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random();
    const channel = new BroadcastChannel(this.channelName);
    const listeners = new Set();
    channel.onmessage = event => {
      const value = event.data;
      if (!value || value.version !== 1 || typeof value.peer !== 'string' || !['audience','presenter'].includes(value.role)) return;
      for (const listener of listeners) listener(value);
    };
    return {
      peer,
      send(value) { channel.postMessage({ ...value, version: 1, role, peer }); },
      listen(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      close() { listeners.clear(); channel.close(); },
    };
  },
};
