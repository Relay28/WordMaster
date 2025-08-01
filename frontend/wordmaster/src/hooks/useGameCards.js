import { useState, useEffect, useCallback } from 'react';
import { useUserAuth } from '../components/context/UserAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Custom hook to handle card operations in the game
 */
export default function useGameCards(sessionId) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [pendingCardUse, setPendingCardUse] = useState(false);
  const [cardResult, setCardResult] = useState(null);
  const { user, getToken } = useUserAuth();

  // Fetch player's cards
  const fetchCards = useCallback(async () => {
    if (!sessionId || !user?.id) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `${API_URL}/api/cards/player/${sessionId}/user/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCards(data);
        console.log('[Cards Debug] Fetched cards:', data);
      } else {
        console.error('[Cards Debug] Failed to fetch cards:', response.status);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user?.id, getToken]);

  // Use a card with a sentence
  const useCard = useCallback(async (cardId, sentence) => {
    if (!cardId || !sentence?.trim()) {
      return {
        success: false,
        message: 'Please write a sentence first before using a card!'
      };
    }

    if (pendingCardUse) {
      return {
        success: false,
        message: 'A card is already being processed'
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
      setCardResult(result);
      
      if (result.success) {
        // Update the local cards list by removing the used card
        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
        setSelectedCard(null);
      }
      
      return result;
    } catch (error) {
      console.error('Error using card:', error);
      return {
        success: false,
        message: 'Error using card: ' + error.message
      };
    } finally {
      setPendingCardUse(false);
    }
  }, [pendingCardUse, getToken]);

  // Initial card fetch
  useEffect(() => {
    if (sessionId && user?.id) {
      fetchCards();
    }
  }, [sessionId, user?.id, fetchCards]);

  return {
    cards,
    loading,
    selectedCard,
    pendingCardUse,
    cardResult,
    fetchCards,
    useCard,
    selectCard: setSelectedCard,
    clearCardResult: () => setCardResult(null)
  };
}
