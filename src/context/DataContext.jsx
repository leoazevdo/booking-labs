import React, { createContext, useState, useEffect, useContext } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [professores, setProfessores] = useState(JSON.parse(localStorage.getItem('professores')) || []);
  const [agendamentos, setAgendamentos] = useState(JSON.parse(localStorage.getItem('agendamentos')) || []);

  useEffect(() => { localStorage.setItem('user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('professores', JSON.stringify(professores)); }, [professores]);
  useEffect(() => { localStorage.setItem('agendamentos', JSON.stringify(agendamentos)); }, [agendamentos]);

  const login = (loginInput) => {
    if (loginInput === 'admin') {
      setUser({ login: 'admin', nome: 'Administrador', role: 'admin' });
      return { success: true, role: 'admin' };
    }
    const professorEncontrado = professores.find(p => p.login === loginInput);
    if (professorEncontrado) {
      setUser({ ...professorEncontrado, role: 'professor' });
      return { success: true, role: 'professor' };
    }
    return { success: false };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const adicionarProfessores = (novos) => setProfessores([...professores, ...novos]);
  
  // --- NOVA FUNÇÃO PARA EXCLUIR PROFESSOR ---
  const removerProfessor = (id) => {
    setProfessores(professoresAntigos => professoresAntigos.filter(p => p.id !== id));
  };

  const novoAgendamento = (evento) => setAgendamentos([...agendamentos, evento]);

  const removerAgendamento = (id) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  const editarAgendamento = (eventoEditado) => {
    setAgendamentos(prev => prev.map(a => a.id === eventoEditado.id ? eventoEditado : a));
  };

  return (
    <DataContext.Provider value={{ 
      user, professores, agendamentos, 
      login, logout, 
      adicionarProfessores, removerProfessor, 
      novoAgendamento, removerAgendamento, editarAgendamento
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);