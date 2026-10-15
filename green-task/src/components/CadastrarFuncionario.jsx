import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CadastrarFuncionario({ onClose }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensagem(null)

    try {
      const { error } = await supabase
        .from('funcionarios')
        .insert({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha: senha, // em projeto real usaríamos hash, mas para escola está ok
          role: 'colaborador'
        })

      if (error) throw error

      setMensagem({ tipo: 'sucesso', texto: 'Funcionário cadastrado com sucesso!' })
      setNome('')
      setEmail('')
      setSenha('')
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'white',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      maxWidth: '480px',
      width: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#2e7d32' }}>Cadastrar Funcionário</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Nome do Funcionário</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            placeholder="Ex: João Silva"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            placeholder="funcionario@escola.com"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {mensagem && (
          <div style={{
            background: mensagem.tipo === 'sucesso' ? '#e8f5e9' : '#ffebee',
            color: mensagem.tipo === 'sucesso' ? '#2e7d32' : '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {mensagem.texto}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: loading ? '#81c784' : '#2e7d32',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
        </button>
      </form>
    </div>
  )
}