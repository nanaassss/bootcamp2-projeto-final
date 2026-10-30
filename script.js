const form = document.getElementById("form-busca");
const inputTermo = document.getElementById("termo");
const statusEl = document.getElementById("status");
const resultadosEl = document.getElementById("resultados");

const cache = new Map();

async function buscarLivros(termo) {
  const chave = termo.toLowerCase();
  if (cache.has(chave)) return cache.get(chave);

  const url =
    "https://openlibrary.org/search.json?q=" +
    encodeURIComponent(termo) +
    "&limit=12&fields=key,title,author_name,first_publish_year,cover_i";

  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);

  const dados = await resposta.json();
  cache.set(chave, dados);
  return dados;
}
// Configuração do SUPABASE
const SUPABASE_URL = "https://sarazhmtidgqhywaadfo.supabase.co"; // Substitua pelo URL do seu projeto Supabase
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcmF6aG10aWRncWh5d2FhZGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNTE3NzksImV4cCI6MjEwODYyNzc3OX0.NE-lEkDWszSe0zfixoOA2Wq-LwDrq54gfviiSLuRzeM";

function criarCard(livro) {
  const card = document.createElement("article");
  card.className = "card";

  const capa = livro.cover_i
    ? `<img src="https://covers.openlibrary.org/b/id/${livro.cover_i}-M.jpg" alt="Capa de ${livro.title}" loading="lazy" />`
    : `<div class="sem-capa">Sem capa</div>`;

  const autor = livro.author_name ? livro.author_name[0] : "Autor desconhecido";
  const ano = livro.first_publish_year || "Ano não informado";

  card.innerHTML = `
    ${capa}
    <div class="info">
      <h2></h2>
      <p class="autor"></p>
      <p class="ano"></p>
      <a href="https://openlibrary.org${livro.key}" target="_blank" rel="noopener">Ver na Open Library</a>
    </div>
  `;
  // textContent evita injetar HTML vindo da API
  card.querySelector("h2").textContent = livro.title;
  card.querySelector(".autor").textContent = autor;
  card.querySelector(".ano").textContent = ano;
  return card;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const termo = inputTermo.value.trim();
  if (!termo) return;

  statusEl.textContent = "Buscando...";
  statusEl.className = "status";
  resultadosEl.innerHTML = "";

  try {
    const dados = await buscarLivros(termo);

    if (dados.docs.length === 0) {
      statusEl.textContent = "Nenhum livro encontrado. Tente outro termo.";
      return;
    }

    statusEl.textContent =
      "A API respondeu: " + dados.numFound + " resultados (mostrando " + dados.docs.length + ").";
    dados.docs.forEach((livro) => resultadosEl.appendChild(criarCard(livro)));
  } catch (erro) {
    console.error(erro);
    statusEl.textContent = "Não foi possível buscar os livros. Verifique sua conexão e tente de novo.";
    statusEl.className = "status erro";
  }
});