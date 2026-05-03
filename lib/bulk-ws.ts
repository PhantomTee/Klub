import { useUIStore } from '../store/uiStore';

export class BulkWebSocket {
  private ws: WebSocket | null = null;
  private subs = new Map<string, any>();
  private reconnectDelay = 1000;
  private isConnected = false;

  private get url() {
    return useUIStore.getState().environment === 'testnet'
      ? 'wss://testnet-ws1.bulk.trade'
      : 'wss://exchange-ws1.bulk.trade';
  }

  constructor(public onMessage: (msg: any) => void) {}

  connect() {
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Bulk WS Connected to ' + this.url);
      this.isConnected = true;
      this.reconnectDelay = 1000;
      this.resubscribeAll();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.onMessage(msg);
      } catch(e) {}
    };

    this.ws.onclose = () => {
      console.log('Bulk WS Closed, reconnecting...');
      this.isConnected = false;
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    };
  }

  reconnect() {
    if (this.ws) {
      // Temporarily remove onclose so it doesn't trigger auto-reconnect logic and wait explicitly
      this.ws.onclose = null; 
      this.ws.close();
    }
    this.isConnected = false;
    this.connect();
  }

  subscribe(topic: string, subPayload: any) {
    this.subs.set(topic, subPayload);
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({ method: 'subscribe', subscription: [subPayload] }));
    }
  }

  unsubscribe(topic: string) {
    this.subs.delete(topic);
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({ method: 'unsubscribe', subscription: [{ topic }] }));
    }
  }

  private resubscribeAll() {
    if (this.subs.size === 0) return;
    const subscriptions = Array.from(this.subs.values());
    this.ws?.send(JSON.stringify({ method: 'subscribe', subscription: subscriptions }));
  }
}
