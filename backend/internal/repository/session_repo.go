package repository

import (
	"errors"
	"sync"

	"github.com/abdu/ethio-guessr/backend/internal/models"
)

type SessionRepository interface {
	CreateSession(session *models.GameSession) error
	GetSession(id string) (*models.GameSession, error)
	UpdateSession(session *models.GameSession) error
	DeleteSession(id string) error
}

type InMemorySessionRepository struct {
	sessions map[string]*models.GameSession
	mu       sync.RWMutex
}

func NewInMemorySessionRepository() *InMemorySessionRepository {
	return &InMemorySessionRepository{
		sessions: make(map[string]*models.GameSession),
	}
}

func (r *InMemorySessionRepository) CreateSession(session *models.GameSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[session.ID] = session
	return nil
}

func (r *InMemorySessionRepository) GetSession(id string) (*models.GameSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	session, ok := r.sessions[id]
	if !ok {
		return nil, errors.New("session not found")
	}
	return session, nil
}

func (r *InMemorySessionRepository) UpdateSession(session *models.GameSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[session.ID] = session
	return nil
}

func (r *InMemorySessionRepository) DeleteSession(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, id)
	return nil
}
