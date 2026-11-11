
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GerenciarSetores({ onClose }) {
  const [setores, setSetores] = useState([])
  const [nome, setNome] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const notify = (tipo, texto) => {
    setMensagem({ tipo, texto })
  }

  const fetchSetores = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('nome')

    if (error) {
      notify('erro', error.message)
    } else {
      setSetores(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchSetores()
  }, [])

  const handleCriar = async (e) => {
    e.preventDefault()

    if (!nome.trim()) return

    setSaving(true)

    const { error } = await supabase
      .from('setores')
      .insert({ nome: nome.trim() })

    if (error) {
      notify('erro', error.message)
    } else {
      setNome('')
      notify('sucesso', 'Setor criado com sucesso!')
      await fetchSetores()
    }

    setSaving(false)
  }

  const handleEditar = async (id) => {
    if (!editNome.trim()) return

    setSaving(true)

    const { error } = await supabase
      .from('setores')
      .update({ nome: editNome.trim() })
      .eq('id', id)

    if (error) {
      notify('erro', error.message)
    } else {
      setEditandoId(null)
      setEditNome('')
      notify('sucesso', 'Setor atualizado!')
      await fetchSetores()
    }

    setSaving(false)
  }

  const handleExcluir = async () => {
    if (!confirmDelete) return

    const { error } = await supabase
      .from('setores')
      .delete()
      .eq('id', confirmDelete.id)

    if (error) {
      notify('erro', error.message)
    } else {
      notify('sucesso', 'Setor excluído!')
      await fetchSetores()
    }

    setConfirmDelete(null)
  }

  return (
    <div className="gt-panel management-panel">

      <div className="management-header">
        <div>
          <span className="section-eyebrow">ADMINISTRAÇÃO</span>
          <h2>Gerenciar Setores</h2>
          <p>Organize os setores da sua equipe.</p>
        </div>

        <button className="gt-icon-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {mensagem && (
        <div className={`gt-message ${mensagem.tipo}`}>
          {mensagem.tipo === 'sucesso' ? '✓' : '⚠'}
          {mensagem.texto}
          <button onClick={() => setMensagem(null)}>×</button>
        </div>
      )}

      <form className="sector-create-form" onSubmit={handleCriar}>
        <input
          className="gt-input"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome do novo setor..."
          required
        />

        <button className="gt-primary-btn" disabled={saving}>
          {saving ? 'Salvando...' : '+ Criar setor'}
        </button>
      </form>

      <div className="management-list-header">
        <h3>Setores cadastrados</h3>
        <span>{setores.length} setores</span>
      </div>

      {loading ? (
        <div className="gt-loading">
          <div className="app-loading-spinner" />
          <p>Carregando setores...</p>
        </div>
      ) : setores.length === 0 ? (
        <div className="gt-empty-state">
          <div className="gt-empty-icon">▣</div>
          <h3>Nenhum setor cadastrado</h3>
          <p>Crie seu primeiro setor utilizando o formulário acima.</p>
        </div>
      ) : (
        <div className="management-list">

          {setores.map((setor, index) => (
            <div
              className="management-item"
              key={setor.id}
              style={{ animationDelay: `${index * 40}ms` }}
            >

              {editandoId === setor.id ? (
                <div className="management-edit">
                  <input
                    className="gt-input"
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    autoFocus
                  />

                  <button
                    className="gt-primary-btn"
                    disabled={saving}
                    onClick={() => handleEditar(setor.id)}
                  >
                    Salvar
                  </button>

                  <button
                    className="gt-secondary-btn"
                    onClick={() => {
                      setEditandoId(null)
                      setEditNome('')
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div className="management-item-info">
                    <div className="management-item-icon">▣</div>
                    <span>{setor.nome}</span>
                  </div>

                  <div className="management-item-actions">
                    <button
                      className="gt-secondary-btn"
                      onClick={() => {
                        setEditandoId(setor.id)
                        setEditNome(setor.nome)
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="gt-danger-btn"
                      onClick={() => setConfirmDelete(setor)}
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
            <h2>Excluir setor?</h2>
            <p>
              Deseja realmente excluir o setor
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
