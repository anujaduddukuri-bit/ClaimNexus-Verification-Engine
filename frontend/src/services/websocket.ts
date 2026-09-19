import { ExecutionEvent } from '../types';

export class ExecutionWebSocket {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(executionId: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws/executions/${executionId}`;
  }

  connect(onEvent: (event: ExecutionEvent) => void) {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = (e) => {
        try {
          const data: ExecutionEvent = JSON.parse(e.data);
          onEvent(data);
        } catch (err) {
          console.error("Failed parsing WS event:", err);
        }
      };
      this.ws.onerror = (err) => {
        console.warn("WebSocket connection error:", err);
      };
    } catch (e) {
      console.warn("WebSocket creation error:", e);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
