import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const LISTA_TURMAS = [
  "Infantil III", "Infantil IV", "Infantil V",
  "1º Ano 1 - Fundamental", "1º Ano 2 - Fundamental", "1º Ano 3 - Fundamental",
  "2º Ano 1 - Fundamental", "2º Ano 2 - Fundamental", "2º Ano 3 - Fundamental",
  "3º Ano 1 - Fundamental", "3º Ano 2 - Fundamental", "3º Ano 3 - Fundamental",
  "4º Ano 1 - Fundamental", "4º Ano 2 - Fundamental", "4º Ano 3 - Fundamental",
  "5º Ano 1 - Fundamental", "5º Ano 2 - Fundamental", "5º Ano 3 - Fundamental",
  "6º Ano 1 - Fundamental", "6º Ano 2 - Fundamental", "6º Ano 3 - Fundamental",
  "7º Ano 1 - Fundamental", "7º Ano 2 - Fundamental", "7º Ano 3 - Fundamental",
  "8º Ano 1 - Fundamental", "8º Ano 2 - Fundamental", "8º Ano 3 - Fundamental",
  "9º Ano 1 - Fundamental", "9º Ano 2 - Fundamental", "9º Ano 3 - Fundamental",
  "1º Ano - Médio", "2º Ano - Médio", "3º Ano - Médio",
  "Período Integral"
];

export default function Dashboard() {
  // --- 1. TODOS OS HOOKS DEVEM FICAR NO TOPO (NUNCA DENTRO DE IF) ---
  
  const { user, agendamentos, novoAgendamento, removerAgendamento, editarAgendamento, logout, loading } = useData();
  const navigate = useNavigate();

  // Estados
  const [dataAtual, setDataAtual] = useState(new Date());
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalDetailsOpen, setModalDetailsOpen] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [turma, setTurma] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('09:00');

  // Redirecionamento (useEffect)
  useEffect(() => {
    if (!loading && !user) {
        navigate('/');
    }
  }, [user, loading, navigate]);

  // Conversão dos Eventos (useMemo) - Corrigido para garantir as cores
  const eventosCalendario = useMemo(() => {
    if (!agendamentos) return [];
    
    return agendamentos.map(evento => {
      // 1. Descobrir onde está a data (pode vir como 'start' ou 'start_time')
      const dataInicioString = evento.start || evento.start_time;
      const dataFimString = evento.end || evento.end_time;

      // 2. Criar objetos Date reais (o calendário exige isso)
      const dataInicioObj = new Date(dataInicioString);
      const dataFimObj = new Date(dataFimString);

      // 3. Retornar o objeto formatado para o Calendário
      return {
        ...evento,
        id: evento.id,
        title: evento.title,
        start: dataInicioObj, // Propriedade OBRIGATÓRIA para o calendário
        end: dataFimObj,      // Propriedade OBRIGATÓRIA para o calendário
        
        // Garante compatibilidade dos outros campos
        professorId: evento.professorId || evento.professor_id, 
        professorNome: evento.professorNome || evento.professor_nome,
        turma: evento.turma
      };
    });
  }, [agendamentos]);
  // --- 2. APENAS AGORA PODEMOS TER RETORNOS CONDICIONAIS ---

  if (loading) {
    return <div style={{display:'flex', justifyContent:'center', marginTop: 50}}>Carregando agenda do servidor...</div>;
  }

  // Se não tiver usuário e já parou de carregar, não renderiza nada (o useEffect vai redirecionar)
  if (!user) return null;

  // --- 3. FUNÇÕES AUXILIARES ---

  const limparFormulario = () => {
    setTurma('');
    setHoraInicio('08:00');
    setHoraFim('09:00');
    setEventoSelecionado(null);
  };

  const handleSelectSlot = ({ start }) => {
    setDiaSelecionado(start);
    limparFormulario();
    setModalCreateOpen(true);
  };

  const handleSelectEvent = (event) => {
    setEventoSelecionado(event);
    setDiaSelecionado(event.start);
    setTurma(event.turma);
    setHoraInicio(format(event.start, 'HH:mm'));
    setHoraFim(format(event.end, 'HH:mm'));
    setModalDetailsOpen(true);
  };

  const handleSalvar = (isEdicao = false) => {
    if (!turma) return alert('Selecione uma Turma.');

    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);

    const baseDate = isEdicao ? eventoSelecionado.start : diaSelecionado;

    const dataInicio = setMinutes(setHours(baseDate, hIni), mIni);
    const dataFim = setMinutes(setHours(baseDate, hFim), mFim);

    if (dataFim <= dataInicio) return alert('Horário final deve ser maior que inicial.');

    const conflito = eventosCalendario.find(evento => {
      if (isEdicao && evento.id === eventoSelecionado.id) return false;
      if (!isSameDay(baseDate, evento.start)) return false;
      return (dataInicio < evento.end && dataFim > evento.start);
    });

    if (conflito) {
      return alert(`Conflito! Horário ocupado por: ${conflito.professorNome}`);
    }

    const payload = {
      title: `${format(dataInicio, 'HH:mm')} - ${format(dataFim, 'HH:mm')} | ${turma} (${user.nome})`,
      start: dataInicio,
      end: dataFim,
      professorId: user.login,
      professorNome: user.nome,
      turma: turma
    };

    if (isEdicao) {
      editarAgendamento({ ...payload, id: eventoSelecionado.id });
      setModalDetailsOpen(false);
    } else {
      novoAgendamento({ ...payload }); 
      setModalCreateOpen(false);
    }
    limparFormulario();
  };

  const handleExcluir = () => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      removerAgendamento(eventoSelecionado.id);
      setModalDetailsOpen(false);
    }
  };

  // ESTILIZAÇÃO (Azul para mim, Vermelho para outros)
  const eventStyleGetter = (event) => {
    // Verifica o ID do evento contra o login do usuário atual
    const ehMeu = event.professorId === user.login;
    return {
      style: {
        backgroundColor: ehMeu ? '#2563eb' : '#ef4444', // Azul ou Vermelho
        color: 'white',
        border: 'none',
        opacity: ehMeu ? 1 : 0.8,
        fontSize: '0.85rem'
      }
    };
  };

  const renderFormulario = () => (
    <>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <label style={{display: 'block', fontSize: '0.9rem'}}>Início</label>
          <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={{width: '100%'}} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{display: 'block', fontSize: '0.9rem'}}>Fim</label>
          <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} style={{width: '100%'}} />
        </div>
      </div>
      <label style={{display: 'block', marginBottom: '5px'}}>Turma / Local</label>
      <select value={turma} onChange={e => setTurma(e.target.value)} style={{ width: '100%', marginBottom: '25px', padding: '10px' }}>
        <option value="" disabled>-- Selecione --</option>
        {LISTA_TURMAS.map((t, i) => <option key={i} value={t}>{t}</option>)}
      </select>
    </>
  );

  // --- 4. RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Prof. {user.nome}</h2>
        <button onClick={() => { logout(); navigate('/'); }} className="secondary" style={{backgroundColor: '#6b7280'}}>Sair</button>
      </div>

      <Calendar
        localizer={localizer}
        events={eventosCalendario}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        date={dataAtual}
        onNavigate={setDataAtual}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        step={15} timeslots={4} defaultView='month' culture='pt-BR'
        messages={{ next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }}
      />

      {/* Modal Criar */}
      {modalCreateOpen && (
        <div style={styles.overlay}>
          <div className="card-container" style={styles.modal}>
            <h3 style={{color: '#2563eb'}}>Novo Agendamento ({diaSelecionado && format(diaSelecionado, 'dd/MM')})</h3>
            {renderFormulario()}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalCreateOpen(false)} className="secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => handleSalvar(false)} style={{ flex: 1 }}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {modalDetailsOpen && eventoSelecionado && (
        <div style={styles.overlay}>
          <div className="card-container" style={styles.modal}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{color: '#2563eb'}}>Detalhes do Agendamento</h3>
                <span style={{fontSize: '0.8rem', color:'#888'}}>Criado por: {eventoSelecionado.professorNome}</span>
            </div>
            
            {eventoSelecionado.professorId === user.login ? (
              <>
                {renderFormulario()}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleExcluir} style={{ flex: 1, backgroundColor: '#ef4444' }}>Excluir</button>
                  <button onClick={() => setModalDetailsOpen(false)} className="secondary" style={{ flex: 1 }}>Voltar</button>
                  <button onClick={() => handleSalvar(true)} style={{ flex: 1, backgroundColor: '#2563eb' }}>Salvar</button>
                </div>
              </>
            ) : (
              <div style={{marginTop: '20px'}}>
                <p><strong>Turma:</strong> {eventoSelecionado.turma}</p>
                <p><strong>Horário:</strong> {format(eventoSelecionado.start, 'HH:mm')} às {format(eventoSelecionado.end, 'HH:mm')}</p>
                <p><strong>Professor:</strong> {eventoSelecionado.professorNome}</p>
                <p style={{color: '#ef4444', fontWeight: 'bold', marginTop: '20px'}}>Este horário está ocupado.</p>
                <button onClick={() => setModalDetailsOpen(false)} className="secondary" style={{width: '100%', marginTop: '10px'}}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    width: '450px', margin: 0, padding: '25px'
  }
};