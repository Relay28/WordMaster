import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UserProfile from './components/UserProfile';
import EditProfile from './components/EditProfile';
import DeactivateAccount from './components/DeactivateAccount';
import Login from './components/Login';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/UserProfile" element={<UserProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/deactivate-account" element={<DeactivateAccount />} />
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </Router>
  );
};

export default App;
