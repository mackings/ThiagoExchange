package trades

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool
}

type Client struct {
	tradeID string
	conn    *websocket.Conn
	mu      sync.Mutex
}

func NewHub() *Hub {
	return &Hub{clients: map[string]map[*Client]bool{}}
}

func (h *Hub) Add(tradeID string, conn *websocket.Conn) *Client {
	client := &Client{tradeID: tradeID, conn: conn}
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[tradeID] == nil {
		h.clients[tradeID] = map[*Client]bool{}
	}
	h.clients[tradeID][client] = true
	return client
}

func (h *Hub) Remove(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[client.tradeID] == nil {
		return
	}
	delete(h.clients[client.tradeID], client)
	if len(h.clients[client.tradeID]) == 0 {
		delete(h.clients, client.tradeID)
	}
	_ = client.conn.Close()
}

func (h *Hub) Broadcast(tradeID string, payload interface{}) {
	h.mu.RLock()
	clients := make([]*Client, 0, len(h.clients[tradeID]))
	for client := range h.clients[tradeID] {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		client.mu.Lock()
		err := client.conn.WriteJSON(payload)
		client.mu.Unlock()
		if err != nil {
			h.Remove(client)
		}
	}
}
