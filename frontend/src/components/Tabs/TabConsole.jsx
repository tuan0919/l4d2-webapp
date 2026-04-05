import React, { useEffect, useRef, useState } from 'react';

const MAX_LINES = 2000;

const classifyLine = (line) => {
  if (/error|ERR|failed/i.test(line)) return 'err';
  if (/warning|WARN/i.test(line)) return 'warn';
  if (/\[SM\]|\[SourceMod\]/i.test(line)) return 'sm';
  if (/L \d+\/\d+\/\d+/.test(line)) return 'info';
  return '';
};

const TabConsole = ({ addToast }) => {
  const [lines, setLines] = useState([]);
  const [command, setCommand] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState('Connecting...');

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const boxRef = useRef(null);

  const appendText = (text) => {
    const next = [];
    String(text)
      .split('\n')
      .forEach((raw) => {
        const line = raw.trimEnd();
        if (!line.trim()) return;
        next.push({ id: `${Date.now()}-${Math.random()}`, text: line, kind: classifyLine(line) });
      });

    if (next.length === 0) return;

    setLines((prev) => {
      const merged = [...prev, ...next];
      return merged.length > MAX_LINES ? merged.slice(merged.length - MAX_LINES) : merged;
    });
  };

  useEffect(() => {
    if (!autoScroll) return;
    const box = boxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [lines, autoScroll]);

  useEffect(() => {
    let destroyed = false;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/console`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (destroyed) return;
        setWsConnected(true);
        setWsStatus('Live');
      };

      ws.onmessage = (event) => {
        if (destroyed) return;
        appendText(event.data);
      };

      ws.onclose = () => {
        if (destroyed) return;
        setWsConnected(false);
        setWsStatus('Reconnecting...');
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const sendCommand = async () => {
    const cmd = command.trim();
    if (!cmd) return;

    appendText(`> ${cmd}`);

    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await response.json();
      if (!(data.ok || data.success || !data.error)) {
        addToast(data.error || 'Failed to send command', 'error');
      }
      setCommand('');
    } catch {
      addToast('Network error', 'error');
    }
  };

  return (
    <>
      <div className="console-toolbar">
        <div className="ws-indicator">
          <div className={`ws-dot ${wsConnected ? 'connected' : ''}`}></div>
          <span>{wsStatus}</span>
        </div>
        <button className="btn btn-ghost" style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }} onClick={() => setLines([])}>
          Clear
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', margin: 0, padding: '6px 11px', fontSize: 12 }}
          onClick={() => setAutoScroll((v) => !v)}
        >
          ⬇ Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="console-box" ref={boxRef}>
        {lines.map((line) => (
          <span key={line.id} className={`console-line ${line.kind}`}>
            {line.text}
          </span>
        ))}
      </div>

      <div className="console-input-row">
        <input
          type="text"
          placeholder="Type a server command and press Enter..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendCommand();
          }}
        />
        <button className="btn btn-primary" style={{ width: 'auto', minWidth: 72, margin: 0 }} onClick={sendCommand}>
          Send
        </button>
      </div>
    </>
  );
};

export default TabConsole;
