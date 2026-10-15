import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TaskList({ user }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('media')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Verifica se é proprietário
  const isOwner = user?.email === 'ricardo.mazon@escola.pr.gov.br' || 
                  user?.user_metadata?.role === 'proprietario'

  // Buscar tarefas
  const fetchTasks = async () => {
    setLoading(true)

    let query = supabase.from('tasks').select('*')

    if (isOwner) {
      // Proprietário vê as tarefas que ele criou
      query = query.eq('user_id', user.id)
    } else {
      // Colaborador só vê as tarefas atribuídas a ele
      query = query.eq('assigned_to', user.email)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar tarefas:', error.message)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  // Criar nova tarefa
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo.trim() || null,
      status: 'pendente'
    })

    if (error) {
      alert('Erro ao criar tarefa: ' + error.message)
    } else {
      setTitle('')
      setDescription('')
      setPriority('media')
      setDueDate('')
      setAssignedTo('')
      setShowForm(false)
      fetchTasks()
    }
  }

  // Alterar status da tarefa
  const changeStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
    } else {
      fetchTasks()
    }
  }

  // Excluir tarefa
  const deleteTask = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      fetchTasks()
    }
  }

  const getStatusColor = (status) => {
    if (status === 'pendente') return '#ff9800'
    if (status === 'em_andamento') return '#2196f3'
    if (status === 'concluida') return '#4caf50'
    return '#999'
  }

  const getPriorityColor = (priority) => {
    if (priority === 'alta') return '#f44336'
    if (priority === 'media') return '#ff9800'
    if (priority === 'baixa') return '#4caf50'
    return '#999'
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#2e7d32', margin: 0 }}>
            {isOwner ? 'Minhas Tarefas' : 'Tarefas Atribuídas'}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            {isOwner ? 'Você é o Proprietário' : 'Você é Colaborador'}
          </p>
        </div>

        {/* Botão só aparece para o Proprietário */}
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#2e7d32',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {showForm ? 'Cancelar' : '+ Nova Tarefa'}
          </button>
        )}
      </div>

      {/* Formulário de criar tarefa (só proprietário) */}
      {isOwner && showForm && (
        <form onSubmit={handleCreateTask} style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              placeholder="Ex: Revisar relatório"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', resize: 'vertical' }}
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Responsável (e-mail do colaborador)</label>
            <input
              type="email"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              placeholder="ex: colaborador@escola.com"
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Prazo</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: '#2e7d32',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Criar Tarefa
          </button>
        </form>
      )}

      {/* Lista de tarefas */}
      {loading ? (
        <p style={{ color: '#666' }}>Carregando tarefas...</p>
      ) : tasks.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#666',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          {isOwner ? 'Nenhuma tarefa criada ainda.' : 'Nenhuma tarefa atribuída a você.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tasks.map((task) => (
            <div key={task.id} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderLeft: `6px solid ${getStatusColor(task.status)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{task.title}</h3>
                <span style={{
                  background: getPriorityColor(task.priority),
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {task.priority}
                </span>
              </div>

              {task.description && (
                <p style={{ color: '#666', margin: '8px 0', fontSize: '14px' }}>{task.description}</p>
              )}

              {task.assigned_to && (
                <p style={{ color: '#555', margin: '4px 0', fontSize: '13px' }}>
                  <strong>Responsável:</strong> {task.assigned_to}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                <select
                  value={task.status}
                  onChange={(e) => changeStatus(task.id, e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '13px'
                  }}
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                </select>

                {task.due_date && (
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                  </span>
                )}

                {/* Só o proprietário pode excluir */}
                {isOwner && (
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      marginLeft: 'auto',
                      background: '#ffebee',
                      color: '#c62828',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}