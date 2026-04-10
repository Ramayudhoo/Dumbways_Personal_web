import pkg from "pg";
const { Pool } = pkg;

export const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "personal_web",
  password: "qwertyu3214",
  port: 5432,
});
