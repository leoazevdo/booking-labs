import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Login() {
  const [input, setInput] = useState('');
  const { login } = useData();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const resultado = login(input);

    if (resultado.success) {
      if (resultado.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } else {
      alert('Usuário não encontrado!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2>Sistema de Agendamento</h2>
        <input 
          type="text" 
          placeholder="Digite seu login (ex: joao.silva)" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: '10px', width: '300px' }}
        />
        <button type="submit" style={{ padding: '10px' }}>Entrar</button>
      </form>
    </div>
  );
}