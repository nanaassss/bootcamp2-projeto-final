const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rotas dos integrantes entram aqui:
 app.use("/api/buscar",require("./routes/buscar"));   // Geovanna
// app.use("/api/livros", require("./routes/livros"));   // Lucas

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Clube do Livro em http://localhost:${PORT}`));
}

module.exports = app;
