import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Login() {
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false); // Adicionei um estado visual de loading
  const { login } = useData();
  const navigate = useNavigate();

  // A função agora é ASYNC porque consulta o banco
  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true); // Bloqueia o botão para não clicar 2x

    // O await espera o Supabase responder antes de continuar
    const resultado = await login(input);

    setCarregando(false);

    if (resultado.success) {
      // Redirecionamento correto conforme sua regra
      if (resultado.role === 'admin') {
        navigate('/admin'); // Vai para a tela de gestão
      } else {
        navigate('/dashboard'); // Vai para a agenda do professor
      }
    } else {
      // Mostra a mensagem que veio do Context (ex: "Erro de conexão" ou "Não encontrado")
      alert(resultado.message || 'Usuário não encontrado!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '90px'}}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Certifique-se que a imagem existe na pasta public */}
        <img style={{ display: 'block', margin: '0 auto', width: '100px', height: 'auto' }} src="/login.png" alt="Logo" />
        
        <h2 style={{ margin: '0', textAlign: 'center' }}>Sistema de Agendamento</h2>
        
        <input 
          type="text" 
          placeholder="Digite seu login (ex: joao.silva)" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={carregando} // Desabilita enquanto carrega
          style={{ padding: '10px', width: '300px' }}
        />
        
        <button 
          type="submit" 
          disabled={carregando} // Desabilita enquanto carrega
          style={{ 
            padding: '10px', 
            cursor: carregando ? 'not-allowed' : 'pointer',
            backgroundColor: carregando ? '#ccc' : '#007bff', // Muda cor se estiver carregando
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}