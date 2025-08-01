import React from 'react';
import AppRoutes from "./AppRoutes"
import { AuthProvider } from './components/context/AdminAuthContext';
import { UserAuthProvider } from './components/context/UserAuthContext';

const App = () => {
  return (
    <UserAuthProvider>
     <AuthProvider> 
   <AppRoutes/>
   </AuthProvider>
   </UserAuthProvider>
  );
};

export default App;
