import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './index.css'

const APP_ENV     = import.meta.env.VITE_APP_ENV     || 'local'
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'

// Temas disponíveis
const TEMAS = [
  { valor: 'light',  label: '☀️ Claro'  },
  { valor: 'dark',   label: '🌙 Escuro' },
  { valor: 'system', label: '⚙️ Sistema' },
]

function App() {
  const [nomes, setNomes]       = useState([])
  const [novoNome, setNovoNome] = useState('')
  const [editando, setEditando] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState('')

  // Lê o tema salvo no localStorage (ou usa 'system' como padrão)
  const [tema, setTema] = useState(
    () => localStorage.getItem('tema') || 'system'
  )

  // Aplica o tema ao elemento <html> sempre que mudar
  useEffect(() => {
    const root = document.documentElement

    if (tema === 'system') {
      // Remove qualquer tema fixo e deixa o sistema decidir
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', tema)
    }

    // Salva a preferência do usuário para persistir entre sessões
    localStorage.setItem('tema', tema)
  }, [tema])

  useEffect(() => {
    carregarNomes()
  }, [])

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

  async function excluirNome(id) {
    if (!confirm('Confirma a exclusão?')) return
    setLoading(true)
    const { error } = await supabase
      .from('nomes')
      .delete()
      .eq('id', id)

    if (error) setErro(error.message)
    else await carregarNomes()
    setLoading(false)
  }

  return (
    <div className="container">

      <header>
        <h1>Cadastro de Nomes</h1>
        <div className={`badge badge-${APP_ENV}`}>
          {APP_ENV === 'production' ? '🟢 Produção' : '🟡 Homologação'}
        </div>
        <div className="version">v{APP_VERSION}</div>
      </header>

      {/* Seletor de tema */}
      <div className="seletor-tema">
        {TEMAS.map(t => (
          <button
            key={t.valor}
            className={`btn-tema ${tema === t.valor ? 'ativo' : ''}`}
            onClick={() => setTema(t.valor)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {erro && (
        <div className="erro">
          ⚠️ {erro}
          <button onClick={() => setErro('')}>✕</button>
        </div>
      )}

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

      {loading && <p className="loading">Carregando...</p>}

      <ul className="lista-nomes">
        {nomes.map(item => (
          <li key={item.id}>
            {editando?.id === item.id ? (
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