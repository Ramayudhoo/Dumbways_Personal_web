import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DATA (sementara, nanti bisa DB)
let projects = [];

// ==================
// HANDLEBARS SETUP
// ==================
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// ==================
// MIDDLEWARE
// ==================
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ==================
// ROUTES
// ==================

// HOME
app.get("/", (req, res) => {
  res.render("index");
});

// CONTACT
app.get("/contact", (req, res) => {
  res.render("contact");
});

// LIST PROJECT
app.get("/project", (req, res) => {
  res.render("my-project", { projects });
});

// CREATE PROJECT
app.post("/project", (req, res) => {
  const { projectName, description, startDate, endDate } = req.body;

  const newProject = {
    id: Date.now(),
    projectName,
    description,
    startDate,
    endDate,
  };

  projects.push(newProject);

  res.redirect("/project");
});

// DETAIL PROJECT
app.get("/project/:id", (req, res) => {
  const { id } = req.params;

  const project = projects.find((p) => p.id == id);

  if (!project) {
    return res.send("Project not found");
  }

  res.render("detail-project", { project });
});

// DELETE PROJECT
app.get("/delete-project/:id", (req, res) => {
  const { id } = req.params;

  projects = projects.filter((p) => p.id != id);

  res.redirect("/project");
});

// EDIT PAGE
app.get("/edit-project/:id", (req, res) => {
  const { id } = req.params;

  const project = projects.find((p) => p.id == id);

  if (!project) {
    return res.send("Project not found");
  }

  res.render("edit-project", { project });
});

// UPDATE PROJECT
app.post("/edit-project/:id", (req, res) => {
  const { id } = req.params;
  const { projectName, description, startDate, endDate } = req.body;

  projects = projects.map((p) =>
    p.id == id ? { ...p, projectName, description, startDate, endDate } : p,
  );

  res.redirect("/project");
});

// ==================
// SERVER
// ==================
app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
