const { validarBusca, montarUrlCapa, formatarAutores, normalizarLivro } = require("./utils");

test("rejeita busca vazia ou com 1 caractere", () => {
  expect(validarBusca("")).toBe(false);
  expect(validarBusca(" a ")).toBe(false);
  expect(validarBusca(undefined)).toBe(false);
});

test("aceita busca válida", () => {
  expect(validarBusca("dom casmurro")).toBe(true);
});

test("monta URL da capa a partir do cover_i", () => {
  expect(montarUrlCapa(12345)).toBe("https://covers.openlibrary.org/b/id/12345-M.jpg");
});

test("retorna null quando o livro não tem capa", () => {
  expect(montarUrlCapa(undefined)).toBeNull();
  expect(montarUrlCapa(-1)).toBeNull();
});

test("formata lista de autores", () => {
  expect(formatarAutores(["Machado de Assis"])).toBe("Machado de Assis");
  expect(formatarAutores(["A", "B", "C"])).toBe("A, B e C");
  expect(formatarAutores([])).toBe("Autor desconhecido");
});

test("normaliza item da Open Library", () => {
  const doc = { key: "/works/OL1W", title: "Dom Casmurro", author_name: ["Machado de Assis"], first_publish_year: 1899, cover_i: 99 };
  expect(normalizarLivro(doc)).toEqual({
    olKey: "/works/OL1W",
    titulo: "Dom Casmurro",
    autor: "Machado de Assis",
    ano: 1899,
    capa: "https://covers.openlibrary.org/b/id/99-M.jpg"
  });
});

test("normaliza item incompleto sem quebrar", () => {
  expect(normalizarLivro({})).toEqual({
    olKey: null,
    titulo: "Sem título",
    autor: "Autor desconhecido",
    ano: null,
    capa: null
  });
});
