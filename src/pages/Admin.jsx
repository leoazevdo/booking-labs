import React from 'react';
import Papa from 'papaparse';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  // Importando a nova função removerProfessor
  const { adicionarProfessores, removerProfessor, professores, logout } = useData();
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const novos = results.data.map((row, index) => {
          const nomeCompleto = row.Nome || row.name || "Sem Nome"; 
          const partes = nomeCompleto.toLowerCase().trim().split(' ');
          const loginGerado = partes.length >= 2 ? `${partes[0]}.${partes[1]}` : partes[0];

          return {
            id: Date.now() + index,
            nome: nomeCompleto,
            login: loginGerado
          };
        });

        adicionarProfessores(novos);
        alert(`${novos.length} professores importados com sucesso!`);
      }
    });
  };

  const handleExcluir = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o professor "${nome}"?`)) {
      removerProfessor(id);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#1f2937' }}>Painel do Administrador</h1>
        <button onClick={() => { logout(); navigate('/') }} className="secondary" style={{backgroundColor: '#ef4444'}}>Sair</button>
      </div>
      
      {/* Cartão de Importação */}
      <div className="card-container" style={{ maxWidth: '100%', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#2563eb' }}>Importar Professores</h3>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>Selecione um arquivo .csv contendo uma coluna "Nome".</p>
        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ width: '100%' }} />
      </div>

      {/* Lista de Professores */}
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', color: '#374151' }}>
        Professores Cadastrados ({professores.length})
      </h3>

      {professores.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>Nenhum professor cadastrado ainda.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {professores.map(p => (
            <li key={p.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{p.nome}</strong>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Login: {p.login}</div>
              </div>
              
              <button 
                onClick={() => handleExcluir(p.id, p.nome)}
                style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '8px 12px', fontSize: '0.85rem' }}
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}