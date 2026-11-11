
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TaskList({ user }) {
  const [tasks, setTasks] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [setores, setSetores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('media')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [setorId, setSetorId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filtroSetor, setFiltroSetor] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [message, setMessage] = useState(null)

  const isOwner =
    user?.email === 'ricardo.mazon@escola.pr.gov.br' ||
    user?.user_metadata?.role === 'proprietario'

  const notify = (tipo, texto) => {
    setMessage({ tipo, texto })
    window.clearTimeout(window.messageTimer)
    window.messageTimer = window.setTimeout(() => {
      setMessage(null)
    }, 3500)
  }

  const fetchData = async () => {
    setLoading(true)

    try {
      let query = supabase.from('tasks').select('*')

      if (isOwner) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('assigned_to', user.email)
      }

      if (filtroSetor) {
        query = query.eq('setor_id', filtroSetor)
      }

      const { data, error } = await query.order(
        'created_at',
        { ascending: false }
      )

      if (error) throw error

      setTasks(data || [])

      if (isOwner) {
        const [funcResult, setorResult] = await Promise.all([
          supabase.from('funcionarios').select('*').order('nome'),
          supabase.from('setores').select('*').order('nome')
        ])

        if (funcResult.error) throw funcResult.error
        if (setorResult.error) throw setorResult.error

        setFuncionarios(funcResult.data || [])
        setSetores(setorResult.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      notify('erro', 'Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id, filtroSetor])

  const handleCreateTask = async (e) => {
    e.preventDefault()

    if (!title.trim()) return

    setSaving(true)

    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        assigned_to: assignedTo || null,
        setor_id: setorId || null,
        status: 'pendente'
      })

      if (error) throw error

      setTitle('')
      setDescription('')
      setPriority('media')
      setDueDate('')
      setAssignedTo('')
      setSetorId('')
      setShowForm(false)

      notify('sucesso', 'Tarefa criada com sucesso!')
      await fetchData()
    } catch (error) {
      notify('erro', error.message)
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (id, newStatus) => {
    const previousTasks = [...tasks]

    setTasks(current =>
      current.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      setTasks(previousTasks)
      notify('erro', 'Erro ao atualizar tarefa: ' + error.message)
    } else {
      notify('sucesso', 'Status atualizado!')
    }
  }

  const deleteTask = async () => {
    if (!confirmDelete) return

    const id = confirmDelete.id

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      notify('erro', error.message)
    } else {
      setTasks(current => current.filter(task => task.id !== id))
      notify('sucesso', 'Tarefa excluída!')
    }

    setConfirmDelete(null)
  }

  const getNomeSetor = (id) => {
    const setor = setores.find(
      s => String(s.id) === String(id)
    )
    return setor?.nome || null
  }

  const statusLabel = {
    pendente: 'Pendente',
    em_andamento: 'Em andamento',
    concluida: 'Concluída'
  }

  const priorityLabel = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa'
  }

  return (
    <div className="task-page">

      <div className="task-page-header">
        <div>
          <span className="section-eyebrow">GREEN TASK</span>
          <h2 className="task-page-title">
            {isOwner ? 'Minhas Tarefas' : 'Tarefas Atribuídas'}
          </h2>
          <p className="task-page-subtitle">
            {isOwner
              ? 'Gerencie e acompanhe suas atividades.'
              : 'Acompanhe as atividades atribuídas a você.'}
          </p>
        </div>

        <div className="task-header-actions">
          {isOwner && (
            <select
              className="gt-input task-filter"
              value={filtroSetor}
              onChange={e => setFiltroSetor(e.target.value)}
            >
              <option value="">Todos os setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          )}

          {isOwner && (
            <button
              className="gt-primary-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancelar' : '+ Nova tarefa'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`gt-message ${message.tipo}`}>
          {message.tipo === 'sucesso' ? '✓' : '⚠'}
          {message.texto}
        </div>
      )}

      {isOwner && showForm && (
        <form className="gt-panel task-form" onSubmit={handleCreateTask}>
          <h3>Nova tarefa</h3>

          <div className="gt-field">
            <label>Título *</label>
            <input
              className="gt-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Revisar relatório"
              required
            />
          </div>

          <div className="gt-field">
            <label>Descrição</label>
            <textarea
              className="gt-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva os detalhes da tarefa..."
              rows="3"
            />
          </div>

          <div className="gt-form-grid">

            <div className="gt-field">
              <label>Responsável</label>
              <select
                className="gt-input"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
              >
                <option value="">Selecione o colaborador</option>
                {funcionarios.map(f => (
                  <option key={f.id} value={f.email}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="gt-field">
              <label>Setor</label>
              <select
                className="gt-input"
                value={setorId}
                onChange={e => setSetorId(e.target.value)}
              >
                <option value="">Selecione o setor</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="gt-field">
              <label>Prioridade</label>
              <select
                className="gt-input"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div className="gt-field">
              <label>Prazo</label>
              <input
                className="gt-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

          </div>

          <button className="gt-primary-btn" disabled={saving}>
            {saving ? 'Criando...' : 'Criar tarefa'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="gt-loading">
          <div className="app-loading-spinner" />
          <p>Carregando tarefas...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="gt-empty-state">
          <div className="gt-empty-icon">✓</div>
          <h3>Nenhuma tarefa encontrada</h3>
          <p>
            {isOwner
              ? 'Crie uma nova tarefa para começar.'
              : 'Quando uma tarefa for atribuída a você, ela aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task, index) => (
            <article
              className={`gt-panel task-card status-${task.status}`}
              key={task.id}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <div className="task-card-top">

                <div className="task-card-title-area">
                  <h3>{task.title}</h3>

                  {task.description && (
                    <p>{task.description}</p>
                  )}
                </div>

                <span className={`priority-badge priority-${task.priority}`}>
                  {priorityLabel[task.priority] || task.priority}
                </span>
              </div>

              <div className="task-metadata">
                {getNomeSetor(task.setor_id) && (
                  <span className="task-meta-chip">
                    ▣ {getNomeSetor(task.setor_id)}
                  </span>
                )}

                {task.assigned_to && (
                  <span className="task-meta-chip">
                    ♙ {task.assigned_to}
                  </span>
                )}

                {task.due_date && (
                  <span className="task-meta-chip">
                    ◷ {new Date(
                      `${task.due_date}T12:00:00`
                    ).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="task-card-footer">
                <div className="task-status-control">
                  <span className={`status-dot ${task.status}`} />

                  <select
                    className="gt-input task-status-select"
                    value={task.status}
                    onChange={e => changeStatus(task.id, e.target.value)}
                  >
                    {Object.entries(statusLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {isOwner && (
                  <button
                    className="gt-danger-btn"
                    onClick={() => setConfirmDelete(task)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </article>
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
            <h2>Excluir tarefa?</h2>
            <p>
              Tem certeza de que deseja excluir
              <strong> "{confirmDelete.title}"</strong>?
              Essa ação não poderá ser desfeita.
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
                onClick={deleteTask}
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
