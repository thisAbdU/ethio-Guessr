package ws

import "sync"

type Hub struct {
	Rooms map[string]*GameRoom
	mu    sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Rooms: make(map[string]*GameRoom),
	}
}

func (h *Hub) GetRoom(id string) *GameRoom {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.Rooms[id]
}

func (h *Hub) RegisterRoom(room *GameRoom) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.Rooms[room.ID] = room
	go room.Run()
}

func (h *Hub) UnregisterRoom(id string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.Rooms, id)
}
