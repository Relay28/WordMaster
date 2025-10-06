// Reusable grammar evaluation UI helpers
export const getGrammarFeedbackColor = (status) => {
  switch (status) {
    case 'PERFECT': return 'rgba(76, 175, 80, 0.1)';
    case 'MINOR_ERRORS': return 'rgba(255, 193, 7, 0.1)';
    case 'MAJOR_ERRORS': return 'rgba(244, 67, 54, 0.1)';
    default: return 'rgba(255,255,255,0.9)';
  }
};

export const getGrammarStatusColor = (status) => {
  switch (status) {
    case 'PERFECT': return '#4CAF50';
    case 'MINOR_ERRORS': return '#FF9800';
    case 'MAJOR_ERRORS': return '#F44336';
    default: return '#9E9E9E';
  }
};

export const getGrammarStatusLabel = (status) => {
  switch (status) {
    case 'PERFECT': return 'Excellent English! 🌟';
    case 'MINOR_ERRORS': return 'Good work! 💡';
    case 'MAJOR_ERRORS': return 'Keep practicing! 📚';
    default: return 'Checking...';
  }
};
