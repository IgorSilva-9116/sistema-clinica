import { useEffect, useState } from 'react'
import { clienteService } from '../services/clienteService'
import { useNavigate, useParams } from 'react-router-dom'

type ClienteForm = {
  nome: string
  telefone: string
  email: string
  ativo: boolean
  sexo: string
  dataNascimento: string
  foto: string
  observacao: string
}

export function NovoCliente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [cliente, setCliente] = useState<ClienteForm>({
    nome: '',
    telefone: '',
    email: '',
    ativo: true,
    sexo: '',
    dataNascimento: '',
    foto: '',
    observacao: ''
  })

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null) // ✅ NOVO

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!id) return

    async function carregarCliente() {
      try {
        const response = await clienteService.buscarPorId(Number(id))
        const c: any = response.cliente

        setCliente({
          nome: c.nome,
          telefone: c.telefone,
          email: c.email ?? '',
          ativo: c.ativo === 'Ativo',
          sexo: c.sexo || '',
          dataNascimento: c.dataNascimento
            ? c.dataNascimento.split('T')[0] // ✅ CORRIGIDO
            : '',
          foto: c.foto || '',
          observacao: c.observacao || ''
        })

        // ✅ MOSTRAR FOTO EXISTENTE
        if (c.foto) {
          setPreview(`http://localhost:3000/uploads/${c.foto}`)
        }

      } catch {
        setErro('Erro ao carregar cliente')
      }
    }

    carregarCliente()
  }, [id])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement
    const { name, value, type } = e.target

    setCliente(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value
    }))
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivo(file)

    setCliente(prev => ({
      ...prev,
      foto: file.name
    }))

    // ✅ PREVIEW DA IMAGEM
    const imageUrl = URL.createObjectURL(file)
    setPreview(imageUrl)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setErro(null)
    setSucesso(false)

    try {
      let payload: any

      if (arquivo) {
        const formData = new FormData()

        formData.append('nome', cliente.nome)
        formData.append('telefone', cliente.telefone)
        formData.append('email', cliente.email)
        formData.append('ativo', cliente.ativo ? 'Ativo' : 'Inativo')
        formData.append('sexo', cliente.sexo)
        formData.append('dataNascimento', cliente.dataNascimento)
        formData.append('foto', arquivo)
        formData.append('observacao', cliente.observacao)


        payload = formData
      } else {
        payload = {
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
          ativo: cliente.ativo ? 'Ativo' : 'Inativo',
          sexo: cliente.sexo,
          dataNascimento: cliente.dataNascimento,
          foto: cliente.foto,
          observacao: cliente.observacao
        }
      }

      if (id) {
        await clienteService.atualizar(Number(id), payload)
      } else {
        await clienteService.criar(payload)
      }

      setSucesso(true)
      setTimeout(() => navigate('/clientes'), 800)

    } catch {
      setErro('Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>{id ? 'Editar Cliente' : 'Novo Cliente'}</h2>

      {erro && <p>{erro}</p>}
      {sucesso && <p>Cliente salvo com sucesso!</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome</label><br />
          <input name="nome" value={cliente.nome} onChange={handleChange} required />
        </div>

        <div>
          <label>Telefone</label><br />
          <input name="telefone" value={cliente.telefone} onChange={handleChange} required />
        </div>

        <div>
          <label>Email</label><br />
          <input name="email" value={cliente.email} onChange={handleChange} />
        </div>

        <div>
          <label>Sexo</label><br />
          <select name="sexo" value={cliente.sexo} onChange={handleChange}>
            <option value="">Selecione</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        <div>
          <label>Data de nascimento</label><br />
          <input
            type="date"
            name="dataNascimento"
            value={cliente.dataNascimento}
            onChange={handleChange}
          />
        </div>

        <div>
           <label>Observações</label><br />

           <textarea
             name="observacao"
             value={cliente.observacao}
             onChange={e =>
             setCliente(prev => ({
              ...prev,
              observacao: e.target.value
            }))
           }
           rows={4}
           cols={50}
           placeholder="Alergias, preferências, restrições, observações importantes..."
          />
        </div>

        <div>
          <label>Foto (opcional)</label><br />
          <input type="file" onChange={handleFotoChange} />

          {/* ✅ PREVIEW */}
          {preview && (
            <div style={{ marginTop: 10 }}>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #ddd'
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              name="ativo"
              checked={cliente.ativo}
              onChange={handleChange}
            />
            Cliente ativo
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}