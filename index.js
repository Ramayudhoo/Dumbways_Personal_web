import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./config/database.js";
import session from "express-session";
import flash from "connect-flash";

const app = express();
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(flash());

// fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HANDLEBARS
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      include: (arr, val) => arr.includes(val),
    },
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// MIDDLEWARE
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ROUTES

// HOME
app.get("/", (req, res) => {
  res.render("index");
});

// CONTACT
app.get("/contact", (req, res) => {
  res.render("contact");
});

// LIST PROJECT (JOIN TECHNOLOGIES)
app.get("/project", async (req, res) => {
  try {
    const result = await db.query(`
  SELECT 
    p.id,
    p.project_name,
    p.description,
    TO_CHAR(p.start_date, 'DD Mon YYYY') AS start_date,
    TO_CHAR(p.end_date, 'DD Mon YYYY') AS end_date,
    ARRAY_AGG(t.name) AS technologies
  FROM projects p
  LEFT JOIN project_technologies pt ON p.id = pt.project_id
  LEFT JOIN technologies t ON pt.technology_id = t.id
  GROUP BY p.id
  ORDER BY p.id DESC
`);

    res.render("my-project", { projects: result.rows });
  } catch (err) {
    console.error(err);
    res.send("Error ambil data");
  }
});

// CREATE PROJECT
app.post("/project", async (req, res) => {
  try {
    let { projectName, description, startDate, endDate, technologies } =
      req.body;

    // VALIDATION
    if (!projectName || !description || !startDate || !endDate) {
      req.flash("error", "Semua field wajib diisi");
      return res.redirect("/project");
    }

    // handle checkbox
    if (!technologies) {
      technologies = [];
    } else if (!Array.isArray(technologies)) {
      technologies = [technologies];
    }

    // 1. INSERT PROJECT
    const result = await db.query(
      `INSERT INTO projects (project_name, description, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [projectName, description, startDate, endDate],
    );

    const projectId = result.rows[0].id;

    // 2. INSERT TECHNOLOGIES (PIVOT)
    for (let techId of technologies) {
      await db.query(
        `INSERT INTO project_technologies (project_id, technology_id)
         VALUES ($1, $2)`,
        [projectId, techId],
      );
    }

    req.flash("success", "Project berhasil ditambahkan");
    res.redirect("/project");
  } catch (err) {
    console.error(err);
    req.flash("error", "Terjadi kesalahan server");
    res.redirect("/project");
  }
});

//get delete project
app.get("/delete-project/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM projects WHERE id = $1", [id]);

    req.flash("success", "Project berhasil dihapus");
    res.redirect("/project");
  } catch (err) {
    console.error(err);
    req.flash("error", "Gagal hapus project");
    res.redirect("/project");
  }
});

//get edit project
app.get("/edit-project/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ambil project
    const projectResult = await db.query(
      "SELECT * FROM projects WHERE id = $1",
      [id],
    );

    const project = projectResult.rows[0];

    // ambil semua technologies
    const techResult = await db.query("SELECT * FROM technologies");

    // ambil tech yg dipilih project
    const selectedTech = await db.query(
      "SELECT technology_id FROM project_technologies WHERE project_id = $1",
      [id],
    );

    const selectedIds = selectedTech.rows.map((t) => t.technology_id);

    res.render("edit-project", {
      project,
      technologies: techResult.rows,
      selectedIds,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error load edit page");
  }
});

//post edit project
app.post("/edit-project/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { projectName, description, startDate, endDate, technologies } =
      req.body;

    // VALIDATION
    if (!projectName || !description || !startDate || !endDate) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Tanggal tidak valid" });
    }

    // NORMALIZE TECH
    if (!technologies) {
      technologies = [];
    } else if (!Array.isArray(technologies)) {
      technologies = [technologies];
    }

    // UPDATE PROJECT
    await db.query(
      `UPDATE projects 
       SET project_name=$1, description=$2, start_date=$3, end_date=$4
       WHERE id=$5`,
      [projectName, description, startDate, endDate, id],
    );

    // RESET PIVOT
    await db.query(`DELETE FROM project_technologies WHERE project_id=$1`, [
      id,
    ]);

    // INSERT TECH BARU
    for (let techId of technologies) {
      await db.query(
        `INSERT INTO project_technologies (project_id, technology_id)
         VALUES ($1, $2)`,
        [id, techId],
      );
    }

    // RESPONSE
    res.json({ message: "Update berhasil" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error update project" });
  }
});
// SERVER
app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
