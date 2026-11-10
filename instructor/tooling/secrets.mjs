// Private terminal input. No secret is echoed, logged or written to a file.
import { emitKeypressEvents } from 'node:readline';

export async function readSecret(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Private input requires an interactive terminal; configure the environment privately instead.');
  }
  emitKeypressEvents(input);
  const wasRaw = input.isRaw;
  process.stdout.write(prompt);
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    function finish(error) {
      input.off('keypress', onKey);
      input.setRawMode(wasRaw);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    }
    function onKey(text, key = {}) {
      if (key.ctrl && (key.name === 'c' || key.name === 'd')) return finish(new Error('Cancelled.'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') { value = value.slice(0, -1); return; }
      if (!key.ctrl && !key.meta && text && value.length < 4096) value += text;
    }
    input.on('keypress', onKey);
  });
}
