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
  "1º Ano A - Fundamental", "1º Ano B - Fundamental", 
  "2º Ano A - Fundamental", "2º Ano B - Fundamental", 
  "3º Ano A - Médio", "3º Ano B - Médio", 
  "Laboratório de Informática", "Laboratório de Ciências", 
  "Sala de Vídeo", "Quadra Poliesportiva", "Reunião Pedagógica"
];

export default function Dashboard() {
  const { user, agendamentos, novoAgendamento, removerAgendamento, editarAgendamento, logout } = useData();
  const navigate = useNavigate();

  const [dataAtual, setDataAtual] = useState(new Date());

  // --- ESTADOS PARA OS MODAIS ---
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalDetailsOpen, setModalDetailsOpen] = useState(false);
  
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null); // Para edição/exclusão

  // Campos do Formulário (Compartilhados entre criar e editar)
  const [turma, setTurma] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('09:00');

  // Converter datas
  const eventosCalendario = useMemo(() => {
    return agendamentos.map(evento => ({
      ...evento,
      start: new Date(evento.start),
      end: new Date(evento.end)
    }));
  }, [agendamentos]);

  if (!user) return <div style={{padding: 20}}>Carregando...</div>;

  // --- FUNÇÕES AUXILIARES ---
  const limparFormulario = () => {
    setTurma('');
    setHoraInicio('08:00');
    setHoraFim('09:00');
    setEventoSelecionado(null);
  };

  // --- ABRIR MODAL DE CRIAÇÃO ---
  const handleSelectSlot = ({ start }) => {
    setDiaSelecionado(start);
    limparFormulario();
    setModalCreateOpen(true);
  };

  // --- ABRIR MODAL DE DETALHES/EDIÇÃO ---
  const handleSelectEvent = (event) => {
    setEventoSelecionado(event);
    setDiaSelecionado(event.start); // Necessário para manter a data base
    
    // Preenche o formulário com os dados do evento clicado
    setTurma(event.turma);
    setHoraInicio(format(event.start, 'HH:mm'));
    setHoraFim(format(event.end, 'HH:mm'));
    
    setModalDetailsOpen(true);
  };

  // --- LÓGICA DE SALVAR (CRIAR OU EDITAR) ---
  const handleSalvar = (isEdicao = false) => {
    if (!turma) return alert('Selecione uma Turma.');

    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);

    // Usa a data do dia selecionado (ou do evento original se for edição)
    const baseDate = isEdicao ? eventoSelecionado.start : diaSelecionado;

    const dataInicio = setMinutes(setHours(baseDate, hIni), mIni);
    const dataFim = setMinutes(setHours(baseDate, hFim), mFim);

    if (dataFim <= dataInicio) return alert('Horário final deve ser maior que inicial.');

    // VERIFICAÇÃO DE CONFLITO
    const conflito = eventosCalendario.find(evento => {
      // Se for edição, ignora o PRÓPRIO evento que estamos editando
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
      novoAgendamento({ ...payload, id: Date.now() });
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

  const eventStyleGetter = (event) => {
    const ehMeu = event.professorId === user.login;
    return {
      style: {
        backgroundColor: ehMeu ? '#2563eb' : '#ef4444',
        color: 'white',
        border: 'none',
        opacity: ehMeu ? 1 : 0.8,
        fontSize: '0.85rem'
      }
    };
  };

  // Renderiza o formulário (reutilizado nos dois modais)
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
              //apenas visualizacao para outros usuarios
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