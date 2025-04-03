import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfileContainer from './components/UserProfileContainer';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/UserProfile" element={<UserProfileContainer />} />
        

      </Routes>
    </Router>
  );
};

export default App;
