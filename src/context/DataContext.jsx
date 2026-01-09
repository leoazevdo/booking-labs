import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // Inicializa o usuário direto do LocalStorage para não perder a sessão no F5
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [professores, setProfessores] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. CARREGAR DADOS AO INICIAR ---
  useEffect(() => {
    // Se tiver usuário logado, busca os dados imediatamente
    if (user) {
      fetchDados();
    } else {
      setLoading(false); // Se não tiver usuário, para de carregar
    }
  }, []); // Array vazio = roda apenas uma vez no F5

  const fetchDados = async () => {
    setLoading(true);
    try {
      console.log("Buscando dados no Supabase...");
      
      // Busca Professores
      const { data: profs, error: errProf } = await supabase.from('professores').select('*');
      if (errProf) throw errProf;
      setProfessores(profs);

      // Busca Agendamentos
      const { data: agends, error: errAgend } = await supabase.from('agendamentos').select('*');
      if (errAgend) throw errAgend;

      console.log("Agendamentos encontrados:", agends.length);
      setAgendamentos(agends);
      
    } catch (error) {
      console.error("Erro ao buscar dados:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOGIN (VERSÃO BLINDADA) ---
  const login = async (loginInput) => {
    const loginFormatado = loginInput.toLowerCase().trim();
    console.log("Tentando logar:", loginFormatado);

    // 2.1 Admin via Código (Garante acesso mesmo se o banco falhar)
    if (loginFormatado === 'admin') {
      const adminUser = { login: 'admin', nome: 'Administrador', role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('user', JSON.stringify(adminUser));
      // Admin não precisa carregar agendamentos agora, mas podemos chamar se quiser
      return { success: true, role: 'admin' };
    }

    // 2.2 Professor via Banco
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('*')
        .eq('login', loginFormatado)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { success: false, message: "Usuário não encontrado." };
      }

      const usuarioLogado = { ...data, role: 'professor' };
      setUser(usuarioLogado);
      localStorage.setItem('user', JSON.stringify(usuarioLogado));
      
      // Ao logar com sucesso, busca os dados da agenda
      fetchDados(); 
      
      return { success: true, role: 'professor' };

    } catch (err) {
      console.error("Erro no login:", err.message);
      return { success: false, message: "Erro de conexão." };
    }
  };

  const logout = () => {
    setUser(null);
    setAgendamentos([]); // Limpa dados ao sair
    localStorage.removeItem('user');
  };

  // --- 3. AÇÕES DE ESCRITA ---

  const adicionarProfessores = async (novos) => {
    const dadosParaSalvar = novos.map(({ id, ...resto }) => resto);
    const { data, error } = await supabase.from('professores').insert(dadosParaSalvar).select();
    
    if (error) alert("Erro: " + error.message);
    else setProfessores([...professores, ...data]);
  };

  const removerProfessor = async (id) => {
    const { error } = await supabase.from('professores').delete().eq('id', id);
    if (!error) setProfessores(prev => prev.filter(p => p.id !== id));
  };

  const novoAgendamento = async (evento) => {
    // Converte para formato do Banco (start_time)
    const eventoBanco = {
      title: evento.title,
      start_time: evento.start,
      end_time: evento.end,
      turma: evento.turma,
      professor_id: evento.professorId,
      professor_nome: evento.professorNome
    };

    const { data, error } = await supabase.from('agendamentos').insert([eventoBanco]).select();

    if (error) {
      alert('Erro ao agendar: ' + error.message);
    } else {
      // Converte de volta para formato do App (start)
      const salvo = data[0];
      const eventoApp = {
        ...salvo,
        start: salvo.start_time,
        end: salvo.end_time
      };
      setAgendamentos([...agendamentos, eventoApp]);
    }
  };

  const removerAgendamento = async (id) => {
    const { error } = await supabase.from('agendamentos').delete().eq('id', id);
    if (!error) {
      setAgendamentos(prev => prev.filter(a => a.id !== id));
    } else {
      alert('Erro ao excluir');
    }
  };

  const editarAgendamento = async (eventoEditado) => {
      const { id, start, end, title, turma } = eventoEditado;
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
            start_time: start, 
            end_time: end, 
            title: title, 
            turma: turma 
        })
        .eq('id', id);

      if (!error) {
        setAgendamentos(prev => prev.map(a => a.id === id ? eventoEditado : a));
      } else {
          alert('Erro ao editar');
      }
  };

  return (
    <DataContext.Provider value={{ 
      user, professores, agendamentos, loading,
      login, logout, 
      adicionarProfessores, removerProfessor, 
      novoAgendamento, removerAgendamento, editarAgendamento 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);