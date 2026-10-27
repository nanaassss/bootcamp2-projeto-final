# Clube do Livro · Bootcamp II · Etapa 03
 
Projeto final em grupo: aplicação web colaborativa com fluxo profissional (branches, Pull Requests, revisão, CI e Docker).
 
**Repositório:** https://github.com/nanaassss/bootcamp2-projeto-final
**Docker Hub:** `<link do Docker Hub>`
 
---
 
## 1. Integrantes e responsabilidades
 
| Nome | RA | Usuário GitHub | Funcionalidade (código) | Responsabilidades acumulativas | PR principal |
|---|---|---|---|---|---|
| Geovanna Gabrielle Dantas Carvalho | 22600318 | [@nanaassss](https://github.com/nanaassss) | Integração com a API Open Library (rota `/api/buscar`, cache e `User-Agent`) + `utils.js` | Testes automatizados (Jest), workflow `ci.yml`, proteção da `main`, CSS (`tema.css`) | `<link da PR>` |
| Vinicius Prates | 22612264 | [@Viniciusss1](https://github.com/Viniciusss1) | Interface web: HTML + JS do front (busca, lista do clube, salvar e excluir livros) | README, `style.css` (estrutura e layout) | `<link da PR>` |
| Lucas Santos Sousa | 22607736 | [@lucassntss059-glitch](https://github.com/lucassntss059-glitch) | Banco de dados Supabase (PostgreSQL) + rotas `/api/livros` (criar, listar, excluir) | Dockerfile e publicação da imagem no Docker Hub | `<link da PR>` |
 
Todos os integrantes escrevem código, abrem Pull Requests e revisam as PRs dos colegas.
 
---
 
## 2. Aplicação
 
**Tema:** Clube do Livro. Os membros buscam livros, salvam no clube com status (quero ler, lendo, lido), nota e comentário, e podem excluir.
 
**API externa:** [Open Library](https://openlibrary.org/developers/api) (sem chave de acesso)
- Busca: `GET https://openlibrary.org/search.json?q=...&fields=key,title,author_name,first_publish_year,cover_i`
- Capas: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
- A chamada é feita pelo backend, com o header `User-Agent` identificando a aplicação e cache de 10 minutos, conforme as diretrizes de uso da API.

**Banco de dados:** [Supabase](https://supabase.com) (PostgreSQL), acessado pelo backend com `@supabase/supabase-js`.
- Tabela `livros` protegida por Row Level Security (RLS).
- O projeto Supabase é exclusivo deste trabalho e contém apenas dados de teste. A aplicação usa somente a chave pública (`anon`); a chave `service_role` não é usada nem publicada.
- Sem as variáveis `SUPABASE_URL` e `SUPABASE_KEY`, a aplicação guarda os livros em memória (os dados somem ao reiniciar), para que ela suba mesmo sem acesso ao banco.

**Tecnologias:** Node.js, Express, Supabase, Jest, GitHub Actions, Docker.
