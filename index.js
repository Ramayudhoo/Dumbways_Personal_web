import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// setup handlebars
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// static folder
app.use(express.static(path.join(__dirname, "public")));

// routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/project", (req, res) => {
  res.render("my-project");
});

// server
app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
