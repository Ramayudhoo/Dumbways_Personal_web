import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./config/database.js";
import session from "express-session";
import flash from "connect-flash";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MULTER CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public/uploads");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF"),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});

// SESSION
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(flash());

// HANDLEBARS
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      include: (arr, val) => arr.includes(val),
      eq: (a, b) => a === b,
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
  res.locals.user = req.session.user || null;
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// AUTH MIDDLEWARE
const isLogin = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error", "Silakan login terlebih dahulu");
    return res.redirect("/login");
  }
  next();
};

// ROUTES
app.get("/", (req, res) => res.render("index"));
app.get("/contact", (req, res) => res.render("contact"));

// REGISTER
app.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/project");
  res.render("register");
});
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      req.flash("error", "Semua field wajib diisi");
      return res.redirect("/register");
    }
    if (password !== confirmPassword) {
      req.flash("error", "Password tidak cocok");
      return res.redirect("/register");
    }
    if (password.length < 6) {
      req.flash("error", "Password minimal 6 karakter");
      return res.redirect("/register");
    }
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      req.flash("error", "Email sudah terdaftar");
      return res.redirect("/register");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword],
    );
    req.flash("success", "Registrasi berhasil! Silakan login");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Terjadi kesalahan server");
    res.redirect("/register");
  }
});

// LOGIN
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/project");
  res.render("login");
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash("error", "Email dan password wajib diisi");
      return res.redirect("/login");
    }
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      req.flash("error", "Email atau password salah");
      return res.redirect("/login");
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      req.flash("error", "Email atau password salah");
      return res.redirect("/login");
    }
    req.session.user = { id: user.id, name: user.name, email: user.email };
    req.flash("success", `Selamat datang, ${user.name}!`);
    res.redirect("/project");
  } catch (err) {
    console.error(err);
    req.flash("error", "Terjadi kesalahan server");
    res.redirect("/login");
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// LIST PROJECT
app.get("/project", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id, p.user_id, p.project_name, p.description, p.image,
        TO_CHAR(p.start_date, 'DD Mon YYYY') AS start_date,
        TO_CHAR(p.end_date, 'DD Mon YYYY') AS end_date,
        ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS technologies
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
app.post("/project", isLogin, upload.single("image"), async (req, res) => {
  try {
    let { projectName, description, startDate, endDate, technologies } =
      req.body;

    if (!projectName || !description || !startDate || !endDate) {
      // hapus file kalau validasi gagal
      if (req.file) fs.unlinkSync(req.file.path);
      req.flash("error", "Semua field wajib diisi");
      return res.redirect("/project");
    }

    if (!technologies) technologies = [];
    else if (!Array.isArray(technologies)) technologies = [technologies];

    const imagePath = req.file ? "/uploads/" + req.file.filename : null;
    const userId = req.session.user.id;

    const result = await db.query(
      `INSERT INTO projects (user_id, project_name, description, start_date, end_date, image)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, projectName, description, startDate, endDate, imagePath],
    );

    const projectId = result.rows[0].id;
    for (let techId of technologies) {
      await db.query(
        `INSERT INTO project_technologies (project_id, technology_id) VALUES ($1, $2)`,
        [projectId, techId],
      );
    }

    req.flash("success", "Project berhasil ditambahkan");
    res.redirect("/project");
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(err);
    req.flash("error", err.message || "Terjadi kesalahan server");
    res.redirect("/project");
  }
});

// DELETE PROJECT
app.get("/delete-project/:id", isLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const project = await db.query(
      "SELECT user_id, image FROM projects WHERE id = $1",
      [id],
    );
    if (project.rows.length === 0 || project.rows[0].user_id !== userId) {
      req.flash("error", "Kamu tidak punya akses untuk menghapus project ini");
      return res.redirect("/project");
    }

    // hapus file image kalau ada
    const image = project.rows[0].image;
    if (image) {
      const filePath = path.join(__dirname, "public", image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query("DELETE FROM projects WHERE id = $1", [id]);
    req.flash("success", "Project berhasil dihapus");
    res.redirect("/project");
  } catch (err) {
    console.error(err);
    req.flash("error", "Gagal hapus project");
    res.redirect("/project");
  }
});

// EDIT PROJECT - GET
app.get("/edit-project/:id", isLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    const projectResult = await db.query(
      "SELECT * FROM projects WHERE id = $1",
      [id],
    );
    const project = projectResult.rows[0];
    if (!project || project.user_id !== userId) {
      req.flash("error", "Akses ditolak");
      return res.redirect("/project");
    }
    const techResult = await db.query("SELECT * FROM technologies");
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

// EDIT PROJECT - POST
app.post(
  "/edit-project/:id",
  isLogin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      let { projectName, description, startDate, endDate, technologies } =
        req.body;

      if (!projectName || !description || !startDate || !endDate) {
        if (req.file) fs.unlinkSync(req.file.path);
        req.flash("error", "Semua field wajib diisi");
        return res.redirect("/project");
      }
      if (new Date(startDate) > new Date(endDate)) {
        if (req.file) fs.unlinkSync(req.file.path);
        req.flash("error", "Tanggal tidak valid");
        return res.redirect("/project");
      }

      const project = await db.query(
        "SELECT user_id, image FROM projects WHERE id = $1",
        [id],
      );
      if (project.rows.length === 0 || project.rows[0].user_id !== userId) {
        if (req.file) fs.unlinkSync(req.file.path);
        req.flash("error", "Akses ditolak");
        return res.redirect("/project");
      }

      if (!technologies) technologies = [];
      else if (!Array.isArray(technologies)) technologies = [technologies];

      // kalau ada file baru, hapus yang lama
      let imagePath = project.rows[0].image;
      if (req.file) {
        if (imagePath) {
          const oldFile = path.join(__dirname, "public", imagePath);
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }
        imagePath = "/uploads/" + req.file.filename;
      }

      await db.query(
        `UPDATE projects SET project_name=$1, description=$2, start_date=$3, end_date=$4, image=$5 WHERE id=$6`,
        [projectName, description, startDate, endDate, imagePath, id],
      );

      await db.query(`DELETE FROM project_technologies WHERE project_id=$1`, [
        id,
      ]);
      for (let techId of technologies) {
        await db.query(
          `INSERT INTO project_technologies (project_id, technology_id) VALUES ($1, $2)`,
          [id, techId],
        );
      }

      req.flash("success", "Project berhasil diupdate");
      res.redirect("/project");
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error(err);
      req.flash("error", err.message || "Error update project");
      res.redirect("/project");
    }
  },
);

// ERROR HANDLER MULTER
app.use((err, req, res, next) => {
  const redirectTo =
    req.get("Referrer") || `/edit-project/${req.params.id || ""}` || "/project";

  if (err.code === "LIMIT_FILE_SIZE") {
    req.flash("error", "Ukuran file maksimal 2MB");
    return res.redirect(redirectTo);
  }

  if (err.message) {
    req.flash("error", err.message);
    return res.redirect(redirectTo);
  }

  next(err);
});

app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));
