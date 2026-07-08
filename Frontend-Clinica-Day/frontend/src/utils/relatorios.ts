export function gerarCSV(dados: any[]) {
  if (!dados || dados.length === 0) {
    return ''
  }

  const colunas = Object.keys(dados[0])

  const linhas = dados.map(item =>
    colunas
      .map(col => `"${item[col] ?? ''}"`)
      .join(';')
  )

  return [
    colunas.join(';'),
    ...linhas
  ].join('\n')
}

export function baixarCSV(
  conteudo: string,
  nomeArquivo: string
) {
  const blob = new Blob(
    [conteudo],
    {
      type:
        'text/csv;charset=utf-8;'
    }
  )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url

  link.setAttribute(
    'download',
    nomeArquivo
  )

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)
}