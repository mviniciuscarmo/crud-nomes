import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './index.css'

// Lê as variáveis de ambiente injetadas pelo Vite no momento do build
const APP_ENV     = import.meta.env.VITE_APP_ENV     || 'local'
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'

function App() {
  // useState é como uma variável de formulário no VB — quando muda, a tela re-renderiza
  const [nomes, setNomes]       = useState([])   // lista de nomes do banco
  const [novoNome, setNovoNome] = useState('')    // valor do input
  const [editando, setEditando] = useState(null)  // { id, nome } do item em edição
  const [loading, setLoading]   = useState(false) // controle de estado de carregamento
  const [erro, setErro]         = useState('')    // mensagem de erro

  // useEffect com array vazio [] = executa UMA vez quando o componente "monta"
  // Equivale ao Form_Load do VB
  useEffect(() => {
    carregarNomes()
  }, [])

  // ── CRUD: READ ──────────────────────────────────────────────────
  async function carregarNomes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('nomes')
      .select('*')
      .order('id', { ascending: true })

    if (error) setErro(error.message)
    else setNomes(data)
    setLoading(false)
  }

  // ── CRUD: CREATE ─────────────────────────────────────────────────
  async function adicionarNome() {
    if (!novoNome.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('nomes')
      .insert([{ nome: novoNome.trim() }])

    if (error) setErro(error.message)
    else {
      setNovoNome('')
      await carregarNomes()
    }
    setLoading(false)
  }

  // ── CRUD: UPDATE ─────────────────────────────────────────────────
  async function salvarEdicao() {
    if (!editando?.nome.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('nomes')
      .update({ nome: editando.nome.trim() })
      .eq('id', editando.id)

    if (error) setErro(error.message)
    else {
      setEditando(null)
      await carregarNomes()
    }
    setLoading(false)
  }

  // ── CRUD: DELETE ─────────────────────────────────────────────────
  async function excluirNome(id) {
    if (!confirm('Confirma a exclusão?X')) return
    setLoading(true)
    const { error } = await supabase
      .from('nomes')
      .delete()
      .eq('id', id)

    if (error) setErro(error.message)
    else await carregarNomes()
    setLoading(false)
  }

  // ── RENDER ───────────────────────────────────────────────────────
  // No React, a função retorna JSX — uma mistura de HTML com JavaScript
  // É como o Designer do VB, mas em código
  return (
    <div className="container">

      {/* Cabeçalho com informações de ambiente e versão */}
      <header>
        <h1>Cadastro de Nomes</h1>
        <div className={`badge badge-${APP_ENV}`}>
          {APP_ENV === 'production' ? '🟢 Produção' : '🟡 Homologação'}
        </div>
        <div className="version">v{APP_VERSION}</div>
      </header>

      {/* Mensagem de erro */}
      {erro && (
        <div className="erro">
          ⚠️ {erro}
          <button onClick={() => setErro('')}>✕</button>
        </div>
      )}

      {/* Formulário de inclusão */}
      <section className="form-inclusao">
        <input
          type="text"
          placeholder="Digite um nome..."
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && adicionarNome()}
          disabled={loading}
        />
        <button onClick={adicionarNome} disabled={loading || !novoNome.trim()}>
          Adicionar
        </button>
      </section>

      {/* Lista de nomes */}
      {loading && <p className="loading">Carregando...</p>}

      <ul className="lista-nomes">
        {nomes.map(item => (
          <li key={item.id}>
            {editando?.id === item.id ? (
              // Modo de edição inline
              <>
                <input
                  type="text"
                  value={editando.nome}
                  onChange={e => setEditando({ ...editando, nome: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && salvarEdicao()}
                  autoFocus
                />
                <button onClick={salvarEdicao}>💾 Salvar</button>
                <button onClick={() => setEditando(null)}>✕ Cancelar</button>
              </>
            ) : (
              // Modo de visualização
              <>
                <span>{item.nome}</span>
                <div className="acoes">
                  <button onClick={() => setEditando({ id: item.id, nome: item.nome })}>
                    ✏️ Editar
                  </button>
                  <button className="btn-excluir" onClick={() => excluirNome(item.id)}>
                    🗑️ Excluir
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {!loading && nomes.length === 0 && (
        <p className="vazio">Nenhum nome cadastrado ainda.</p>
      )}
    </div>
  )
}

export default App