import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfileContainer from './components/UserProfileContainer';
import Login from './components/Login';
import AppRoutes from "./AppRoutes"
import Register from './components/Register';

const App = () => {
  return (
   <AppRoutes/>
  );
};

export default App;
