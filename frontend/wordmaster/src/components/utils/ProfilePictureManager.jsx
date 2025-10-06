import { useEffect, useState } from 'react';

/**
 * This component handles profile picture updates across the application.
 * It listens for storage events and updates the local state when profile pictures change.
 */
export const useProfilePicture = (initialPicture) => {
  const [profilePicture, setProfilePicture] = useState(initialPicture);
  
  useEffect(() => {
    // Update the state if initialPicture changes - this is the priority
    if (initialPicture) {
      setProfilePicture(initialPicture);
    }
  }, [initialPicture]);

  useEffect(() => {
    // Only use localStorage as a fallback if no initial picture is provided
    if (initialPicture) {
      return; // Exit early if initial picture is provided
    }
    
    // Listen for storage events to detect profile picture updates (only for current user)
    const handleStorageChange = (e) => {
      if ((e.key === 'userData' || e.key === null) && !initialPicture) {
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (userData.profilePicture) {
            setProfilePicture(userData.profilePicture);
          }
        } catch (err) {
          console.error('Error parsing userData from localStorage', err);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Attempt to get the latest profile picture from localStorage (only if no initial picture)
    if (!initialPicture) {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.profilePicture) {
          setProfilePicture(userData.profilePicture);
        }
      } catch (err) {
        console.error('Error parsing userData from localStorage', err);
      }
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialPicture]);

  return profilePicture;
};