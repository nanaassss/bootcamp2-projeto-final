// Funções puras do Clube do Livro (fáceis de testar, sem rede nem banco)

function validarBusca(q) {
  return typeof q === "string" && q.trim().length >= 2;
}

function montarUrlCapa(coverId, tamanho = "M") {
  if (!Number.isInteger(coverId) || coverId <= 0) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${tamanho}.jpg`;
}

function formatarAutores(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return "Autor desconhecido";
  if (lista.length === 1) return lista[0];
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

// Converte um item da resposta da Open Library no formato do nosso app
function normalizarLivro(doc) {
  return {
    olKey: doc.key || null,
    titulo: doc.title || "Sem título",
    autor: formatarAutores(doc.author_name),
    ano: doc.first_publish_year || null,
    capa: montarUrlCapa(doc.cover_i)
  };
}

module.exports = { validarBusca, montarUrlCapa, formatarAutores, normalizarLivro };
