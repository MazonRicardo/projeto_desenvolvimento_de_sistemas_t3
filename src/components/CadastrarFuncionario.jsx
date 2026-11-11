
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CadastrarFuncionario({ onClose }) {
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSenha, setEditSenha] = useState('')

  const [mensagem, setMensagem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchFuncionarios = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome')

    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message })
    } else {
      setFuncionarios(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchFuncionarios()
  }, [])

  const handleCriar = async (e) => {
    e.preventDefault()
    setMensagem(null)

    if (senha.length < 6) {
      setMensagem({
        tipo: 'erro',
        texto: 'A senha precisa ter pelo menos 6 caracteres.'
      })
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('funcionarios')
      .insert({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        role: 'colaborador'
      })

    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message })
    } else {
      setNome('')
      setEmail('')
      setSenha('')
      setMostrarForm(false)

      setMensagem({
        tipo: 'sucesso',
        texto: 'Funcionário cadastrado com sucesso!'
      })

      await fetchFuncionarios()
    }

    setSaving(false)
  }

  const handleEditar = async (id) => {
    if (!editNome.trim() || !editEmail.trim()) return

    setSaving(true)

    const dados = {
      nome: editNome.trim(),
      email: editEmail.trim().toLowerCase()
    }

    if (editSenha.trim()) {
      setSaving(false)
      setMensagem({
        tipo: 'erro',
        texto: 'A alteração de senhas deve ser feita pelo Supabase Auth, não pela tabela de funcionários.'
      })
      return
    }

    const { error } = await supabase
      .from('funcionarios')
      .update(dados)
      .eq('id', id)

    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message })
    } else {
      setEditandoId(null)
      setEditNome('')
      setEditEmail('')
      setEditSenha('')

      setMensagem({
        tipo: 'sucesso',
        texto: 'Funcionário atualizado!'
      })

      await fetchFuncionarios()
    }

    setSaving(false)
  }

  const handleExcluir = async () => {
    if (!confirmDelete) return

    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', confirmDelete.id)

    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message })
    } else {
      setMensagem({
        tipo: 'sucesso',
        texto: 'Funcionário excluído!'
      })

      await fetchFuncionarios()
    }

    setConfirmDelete(null)
  }

  return (
    <div className="gt-panel management-panel">

      <div className="management-header">
        <div>
          <span className="section-eyebrow">ADMINISTRAÇÃO</span>
          <h2>Funcionários</h2>
          <p>Gerencie os colaboradores da sua equipe.</p>
        </div>

        <div className="management-header-actions">
          <button
            className="gt-primary-btn"
            onClick={() => {
              setMostrarForm(!mostrarForm)
              setMensagem(null)
            }}
          >
            {mostrarForm ? 'Cancelar' : '+ Cadastrar'}
          </button>

          <button className="gt-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {mensagem && (
        <div className={`gt-message ${mensagem.tipo}`}>
          {mensagem.tipo === 'sucesso' ? '✓' : '⚠'}
          {mensagem.texto}
          <button onClick={() => setMensagem(null)}>×</button>
        </div>
      )}

      {mostrarForm && (
        <form className="gt-panel employee-form" onSubmit={handleCriar}>
          <h3>Novo funcionário</h3>

          <div className="gt-field">
            <label>Nome completo</label>
            <input
              className="gt-input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="gt-field">
            <label>E-mail</label>
            <input
              className="gt-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="funcionario@escola.com"
              required
            />
          </div>

          <div className="gt-field">
            <label>Senha inicial</label>
            <input
              className="gt-input"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              minLength={6}
              placeholder="Mínimo de 6 caracteres"
              required
            />
          </div>

          <button
            className="gt-primary-btn"
            disabled={saving}
          >
            {saving ? 'Cadastrando...' : 'Cadastrar funcionário'}
          </button>
        </form>
      )}

      <div className="management-list-header">
        <h3>Equipe cadastrada</h3>
        <span>{funcionarios.length} colaboradores</span>
      </div>

      {loading ? (
        <div className="gt-loading">
          <div className="app-loading-spinner" />
          <p>Carregando funcionários...</p>
        </div>
      ) : funcionarios.length === 0 ? (
        <div className="gt-empty-state">
          <div className="gt-empty-icon">♙</div>
          <h3>Nenhum funcionário cadastrado</h3>
          <p>Cadastre seu primeiro colaborador para começar.</p>
        </div>
      ) : (
        <div className="management-list">

          {funcionarios.map((func, index) => (
            <div
              className="management-item"
              key={func.id}
              style={{ animationDelay: `${index * 40}ms` }}
            >

              {editandoId === func.id ? (
                <div className="employee-edit">

                  <input
                    className="gt-input"
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    placeholder="Nome"
                  />

                  <input
                    className="gt-input"
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="E-mail"
                  />

                  <input
                    className="gt-input"
                    type="password"
                    value={editSenha}
                    onChange={e => setEditSenha(e.target.value)}
                    placeholder="Alteração de senha não disponível aqui"
                    disabled
                  />

                  <div className="management-item-actions">
                    <button
                      className="gt-primary-btn"
                      disabled={saving}
                      onClick={() => handleEditar(func.id)}
                    >
                      Salvar
                    </button>

                    <button
                      className="gt-secondary-btn"
                      onClick={() => {
                        setEditandoId(null)
                        setEditNome('')
                        setEditEmail('')
                        setEditSenha('')
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="management-item-info">
                    <div className="employee-avatar">
                      {func.nome?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="employee-details">
                      <strong>{func.nome}</strong>
                      <span>{func.email}</span>
                    </div>
                  </div>

                  <div className="management-item-actions">
                    <button
                      className="gt-secondary-btn"
                      onClick={() => {
                        setEditandoId(func.id)
                        setEditNome(func.nome)
                        setEditEmail(func.email)
                        setEditSenha('')
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="gt-danger-btn"
                      onClick={() => setConfirmDelete(func)}
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}

            </div>
          ))}

        </div>
      )}

      {confirmDelete && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <div className="logout-modal-icon">!</div>
            <h2>Excluir funcionário?</h2>
            <p>
              Deseja realmente excluir
              <strong> "{confirmDelete.nome}"</strong>?
            </p>

            <div className="logout-modal-actions">
              <button
                className="logout-cancel-btn"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>

              <button
                className="logout-confirm-btn"
                onClick={handleExcluir}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
