import { useState, useCallback, useEffect } from 'react';
import { useUserAuth } from '../components/context/UserAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Custom hook to manage card functionality
 * @param {string} sessionId - The game session ID
 */
export default function useCards(sessionId) {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingCardUse, setPendingCardUse] = useState(false);
  const { user, getToken } = useUserAuth();

  // Fetch cards from the server
  const fetchCards = useCallback(async () => {
    if (!sessionId || !user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const response = await fetch(
        `${API_URL}/api/cards/player/${sessionId}/user/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status}`);
      }
      
      const data = await response.json();
      setCards(data || []);
      
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user?.id, getToken]);

  // Use a card with a sentence
  const useCard = useCallback(async (cardId, sentence) => {
    if (!cardId || !sentence?.trim() || pendingCardUse) {
      return { 
        success: false, 
        message: !sentence?.trim() 
          ? 'Please write a sentence first before using a card!' 
          : 'Card already being processed'
      };
    }
    
    try {
      setPendingCardUse(true);
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/api/cards/use/${cardId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: sentence })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local card state by marking the used card
        setCards(prevCards => 
          prevCards.filter(card => card.id !== cardId)
        );
        setSelectedCard(null);
      }
      
      return result;
      
    } catch (err) {
      console.error('Error using card:', err);
      return {
        success: false,
        message: `Error: ${err.message}`
      };
    } finally {
      setPendingCardUse(false);
    }
  }, [getToken, pendingCardUse]);

  // Handle selecting a card
  const selectCard = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  // Handle deselecting the current card
  const deselectCard = useCallback(() => {
    setSelectedCard(null);
  }, []);

  // Load cards when session changes or user changes
  useEffect(() => {
    if (sessionId && user?.id) {
      fetchCards();
    }
  }, [sessionId, user?.id, fetchCards]);

  return {
    cards,
    selectedCard,
    loading,
    error,
    pendingCardUse,
    fetchCards,
    useCard,
    selectCard,
    deselectCard
  };
}
