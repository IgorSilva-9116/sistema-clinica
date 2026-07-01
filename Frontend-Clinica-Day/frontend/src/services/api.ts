import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
})

// ==============================
// Interceptor de REQUEST
// Adiciona o token automaticamente
// ==============================
api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// ==============================
// Interceptor de RESPONSE
// Trata token inválido / expirado
// ==============================
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Remove sessão apenas da aba atual
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('usuario')
    }

    return Promise.reject(error)
  }
)
