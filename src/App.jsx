import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';

import Login from './pages/Login';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';

// Componente para proteger rotas (se não estiver logado, volta pro login)
const RotaProtegida = ({ children }) => {
  const { user } = useData();
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={
            <RotaProtegida><Admin /></RotaProtegida>
          } />
          <Route path="/dashboard" element={
            <RotaProtegida><Dashboard /></RotaProtegida>
          } />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;