const express = require("express");
const { validarBusca, normalizarLivro } = require("../utils");

const router = express.Router();

const CONTATO = process.env.CONTATO_EMAIL || "contato@exemplo.com";
const USER_AGENT = `ClubeDoLivro-Bootcamp2 (${CONTATO})`;

const CAMPOS = "key,title,author_name,first_publish_year,cover_i";
const TTL_MS = 10 * 60 * 1000; // cache de 10 minutos
const cache = new Map();

router.get("/", async (req, res) => {
  const q = req.query.q;
  if (!validarBusca(q)) {
    return res.status(400).json({ erro: "Informe pelo menos 2 caracteres na busca (?q=)." });
  }

  const chave = q.trim().toLowerCase();
  const guardado = cache.get(chave);
  if (guardado && Date.now() - guardado.quando < TTL_MS) {
    return res.json(guardado.livros);
  }

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q.trim())}&limit=12&fields=${CAMPOS}`;

  try {
    const resposta = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000)
    });
    if (!resposta.ok) throw new Error(`Open Library respondeu ${resposta.status}`);

    const dados = await resposta.json();
    const livros = (dados.docs || []).map(normalizarLivro);
    cache.set(chave, { quando: Date.now(), livros });
    res.json(livros);
  } catch (erro) {
    console.error("Falha ao consultar Open Library:", erro.message);
    res.status(502).json({ erro: "Não foi possível consultar a Open Library agora." });
  }
});

module.exports = router;
