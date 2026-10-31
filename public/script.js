// ===== Configuração do SUPABASE =====
const SUPABASE_URL = "https://sarazhmtidgqhywaadfo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcmF6aG10aWRncWh5d2FhZGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNTE3NzksImV4cCI6MjEwODYyNzc3OX0.NE-lEkDWszSe0zfixoOA2Wq-LwDrq54gfviiSLuRzeM";

// A biblioteca vem do CDN carregado no index.html (variável global "supabase")
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Elementos da página =====
const form = document.getElementById("form-busca");
const inputTermo = document.getElementById("termo");
const statusEl = document.getElementById("status");
const resultadosEl = document.getElementById("resultados");

const abas = document.querySelectorAll(".aba");
const contadorEl = document.getElementById("contador");
const statusFavEl = document.getElementById("status-fav");
const listaFavEl = document.getElementById("lista-favoritos");

const dialogoAuth = document.getElementById("dialogo-auth");
const btnFechar = document.getElementById("fechar-auth");
const formAuth = document.getElementById("form-auth");
const authNome = document.getElementById("auth-nome");
const authEmail = document.getElementById("auth-email");
const authSenha = document.getElementById("auth-senha");
const authStatus = document.getElementById("auth-status");
const btnEntrar = document.getElementById("btn-entrar");
const btnCriar = document.getElementById("btn-criar");
const sessaoEl = document.getElementById("sessao");
const sessaoUsuario = document.getElementById("sessao-usuario");
const btnSair = document.getElementById("btn-sair");

// ===== Estado =====
let usuario = null;   // usuário logado (ou null)
let favoritos = [];   // favoritos do usuário logado, no formato usado pelos cards
let livroPendente = null; // livro clicado antes do login (é favoritado assim que entrar)

// ===== Login =====
function traduzirErroAuth(erro) {
  const msg = (erro && erro.message) || "";
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail (veja a caixa de entrada) antes de entrar.";
  if (/already registered/i.test(msg)) return "Este e-mail já tem conta. Clique em Entrar.";
  if (/password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Erro: " + msg;
}

function mostrarAuth(texto, erro = false) {
  authStatus.textContent = texto;
  authStatus.className = erro ? "status erro" : "status";
}

function travarAuth(travado) {
  btnEntrar.disabled = travado;
  btnCriar.disabled = travado;
}

formAuth.addEventListener("submit", async (e) => {
  e.preventDefault();
  travarAuth(true);
  mostrarAuth("Entrando...");
  const { error } = await sb.auth.signInWithPassword({
    email: authEmail.value.trim(),
    password: authSenha.value
  });
  travarAuth(false);
  if (error) mostrarAuth(traduzirErroAuth(error), true);
});

btnCriar.addEventListener("click", async () => {
  if (!formAuth.reportValidity()) return;
  const nome = authNome.value.trim();
  if (!nome) {
    mostrarAuth("Informe seu nome para criar a conta.", true);
    authNome.focus();
    return;
  }
  travarAuth(true);
  mostrarAuth("Criando conta...");
  const { data, error } = await sb.auth.signUp({
    email: authEmail.value.trim(),
    password: authSenha.value,
    options: { data: { nome } }
  });
  travarAuth(false);
  if (error) {
    mostrarAuth(traduzirErroAuth(error), true);
  } else if (!data.session) {
    mostrarAuth("Conta criada! Confirme seu e-mail para poder entrar.");
  }
});

btnSair.addEventListener("click", () => sb.auth.signOut());

// Dispara no carregamento da página (sessão salva) e a cada login/logout
sb.auth.onAuthStateChange((_evento, sessao) => {
  usuario = sessao ? sessao.user : null;
  // setTimeout evita chamar o Supabase de dentro do próprio callback
  setTimeout(aoMudarSessao, 0);
});

function abrirLogin(mensagem) {
  mostrarAuth(mensagem);
  if (!dialogoAuth.open) dialogoAuth.showModal();
  authEmail.focus();
}

btnFechar.addEventListener("click", () => dialogoAuth.close());

// clicar fora da janela (no fundo escuro) também fecha
dialogoAuth.addEventListener("click", (e) => {
  if (e.target === dialogoAuth) dialogoAuth.close();
});

// se fechou sem entrar, esquece o livro que estava esperando
dialogoAuth.addEventListener("close", () => {
  if (!usuario) livroPendente = null;
});

async function aoMudarSessao() {
  sessaoEl.hidden = !usuario;

  if (usuario) {
    sessaoUsuario.textContent = "Logado como " + (usuario.user_metadata?.nome || usuario.email);
    const pendente = livroPendente;
    livroPendente = null;
    formAuth.reset();
    mostrarAuth("");
    if (dialogoAuth.open) dialogoAuth.close();
    await carregarFavoritos();

    // favorita o livro em que a pessoa clicou antes de entrar
    if (pendente && !ehFavorito(pendente.key)) {
      try {
        await adicionarFavorito(pendente);
        atualizarFavoritos();
      } catch (erro) {
        console.error("Erro ao favoritar após login:", erro);
        alert("Você entrou, mas não foi possível salvar o favorito. Veja o console (F12).");
      }
    }
  } else {
    favoritos = [];
    mostrarAuth("");
    atualizarFavoritos();
  }
}

// ===== Favoritos (tabela "favoritos" no Supabase, um conjunto por usuário) =====
function montarCapaUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
}

function deLinha(linha) {
  return {
    key: linha.api_livro_id,
    title: linha.titulo,
    author_name: linha.autores ? [linha.autores] : undefined,
    capaUrl: linha.capa_url || undefined
  };
}

function ehFavorito(chave) {
  return favoritos.some((l) => l.key === chave);
}

async function carregarFavoritos() {
  statusFavEl.textContent = "Carregando favoritos…";
  statusFavEl.className = "status";
  const { data, error } = await sb
    .from("favoritos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao carregar favoritos:", error);
    statusFavEl.textContent = "Não foi possível carregar os favoritos do banco. Veja o console (F12) para detalhes.";
    statusFavEl.className = "status erro";
    return;
  }
  favoritos = data.map(deLinha);
  atualizarFavoritos();
}

async function adicionarFavorito(livro) {
  const linha = {
    usuario_id: usuario.id,
    api_livro_id: livro.key,
    titulo: livro.title,
    autores: livro.author_name ? livro.author_name.join(", ").slice(0, 255) : null,
    capa_url: livro.capaUrl || montarCapaUrl(livro.cover_i)
  };
  const { error } = await sb.from("favoritos").insert(linha);
  // 23505 = já era favorito (índice único usuario_id + api_livro_id)
  if (error && error.code !== "23505") throw error;
  if (!ehFavorito(livro.key)) favoritos.unshift(deLinha(linha));
}

async function removerFavorito(chave) {
  const { error } = await sb
    .from("favoritos")
    .delete()
    .eq("usuario_id", usuario.id)
    .eq("api_livro_id", chave);
  if (error) throw error;
  favoritos = favoritos.filter((l) => l.key !== chave);
}

async function alternarFavorito(livro, botao) {
  if (!usuario) {
    livroPendente = livro;
    abrirLogin("Entre na sua conta ou crie uma para favoritar este livro.");
    return;
  }

  botao.disabled = true;
  try {
    if (ehFavorito(livro.key)) {
      await removerFavorito(livro.key);
    } else {
      await adicionarFavorito(livro);
    }
    atualizarFavoritos();
  } catch (erro) {
    console.error("Erro ao atualizar favorito:", erro);
    alert("Não foi possível salvar essa alteração no banco. Veja o console (F12) para detalhes.");
  } finally {
    botao.disabled = false;
  }
}

// ===== Busca =====
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

// ===== Card =====
function textoBotao(chave, naAbaFavoritos) {
  if (naAbaFavoritos) return "Remover dos favoritos";
  return ehFavorito(chave) ? "★ Favoritado" : "☆ Favoritar";
}

function criarCard(livro, naAbaFavoritos = false) {
  const card = document.createElement("article");
  card.className = "card";

  const capaUrl = livro.capaUrl || montarCapaUrl(livro.cover_i);
  if (capaUrl) {
    const img = document.createElement("img");
    img.src = capaUrl;
    img.alt = "Capa de " + livro.title;
    img.loading = "lazy";
    card.appendChild(img);
  } else {
    const semCapa = document.createElement("div");
    semCapa.className = "sem-capa";
    semCapa.textContent = "Sem capa";
    card.appendChild(semCapa);
  }

  const info = document.createElement("div");
  info.className = "info";
  info.innerHTML = `
    <h2></h2>
    <p class="autor"></p>
    <p class="ano"></p>
    <a href="https://openlibrary.org${livro.key}" target="_blank" rel="noopener">Ver na Open Library</a>
  `;
  // textContent evita injetar HTML vindo da API
  info.querySelector("h2").textContent = livro.title;
  info.querySelector(".autor").textContent = livro.author_name ? livro.author_name[0] : "Autor desconhecido";
  if (naAbaFavoritos) {
    info.querySelector(".ano").remove(); // a tabela não guarda o ano
  } else {
    info.querySelector(".ano").textContent = livro.first_publish_year || "Ano não informado";
  }

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-fav";
  botao.dataset.key = livro.key;
  botao.textContent = textoBotao(livro.key, naAbaFavoritos);
  if (!naAbaFavoritos && ehFavorito(livro.key)) botao.classList.add("ativo");
  botao.addEventListener("click", () => alternarFavorito(livro, botao));
  info.appendChild(botao);

  card.appendChild(info);
  return card;
}

// ===== Atualização da interface =====
function renderizarFavoritos() {
  listaFavEl.innerHTML = "";
  statusFavEl.className = "status";

  if (!usuario) {
    statusFavEl.textContent = "Entre na sua conta para ver seus favoritos.";
    return;
  }
  if (favoritos.length === 0) {
    statusFavEl.textContent = "Você ainda não favoritou nenhum livro. Busque um livro e clique em “Favoritar”.";
    return;
  }

  statusFavEl.textContent =
    favoritos.length === 1 ? "1 livro favoritado." : favoritos.length + " livros favoritados.";
  favoritos.forEach((livro) => listaFavEl.appendChild(criarCard(livro, true)));
}

function sincronizarBotoesDaBusca() {
  resultadosEl.querySelectorAll(".btn-fav").forEach((botao) => {
    const favorito = ehFavorito(botao.dataset.key);
    botao.classList.toggle("ativo", favorito);
    botao.textContent = textoBotao(botao.dataset.key, false);
  });
}

function atualizarFavoritos() {
  contadorEl.textContent = favoritos.length;
  renderizarFavoritos();
  sincronizarBotoesDaBusca();
}

// ===== Abas =====
function abrirAba(abaSelecionada) {
  abas.forEach((aba) => {
    const ativa = aba === abaSelecionada;
    aba.setAttribute("aria-selected", String(ativa));
    document.getElementById(aba.getAttribute("aria-controls")).hidden = !ativa;
  });
}

abas.forEach((aba) => aba.addEventListener("click", () => abrirAba(aba)));

// ===== Envio da busca =====
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

// ===== Início =====
atualizarFavoritos();
