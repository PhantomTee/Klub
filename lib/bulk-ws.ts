export class BulkWebSocket {
  private ws: WebSocket | null = null;
  private url = 'wss://exchange-ws1.bulk.trade';
  private subs = new Map<string, any>();
  private reconnectDelay = 1000;
  private isConnected = false;

  constructor(public onMessage: (msg: any) => void) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Bulk WS Connected');
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

    // Note: If using Node.js, handle 'ping' event directly. 
    // In browsers, the browser automatically responds with 'pong'.
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
