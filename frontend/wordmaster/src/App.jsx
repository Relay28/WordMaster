import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfileContainer from './components/UserProfileContainer';
import Login from './components/Login';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/UserProfile" element={<UserProfileContainer />} />
        <Route path='/login' element={<Login/>}/>

      </Routes>
    </Router>
  );
};

export default App;
