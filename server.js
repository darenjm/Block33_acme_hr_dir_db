const express = require("express");
const pg = require("pg");
const morgan = require("morgan");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

const server = express();

const init = async () => {
  await client.connect();

  let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS department;
        CREATE TABLE department(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES department(id) NOT NULL

        );

        INSERT INTO department(name) VALUES('technology');
        INSERT INTO department(name) VALUES('marketing');
        INSERT INTO department(name) VALUES('design');

        INSERT INTO employees(name, department_id) VALUES('Lugene', (SELECT id FROM department WHERE name='design'));
        INSERT INTO employees(name, department_id) VALUES('Hali', (SELECT id FROM department WHERE name='marketing'));
        INSERT INTO employees(name, department_id) VALUES('Derik', (SELECT id FROM department WHERE name='technology'));
    `;
  await client.query(SQL);

  const port = process.env.PORT || 3030;
  server.listen(port, () => console.log(`listening on port ${port}`));
};

init();

server.use(express.json());
server.use(morgan("dev"));

server.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});

server.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * from department;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});

server.post("/api/employees", async (req, res, next) => {
  try {
    const { name, department_id } = req.body;
    const SQL = `INSERT INTO employees (name, department_id) VALUES($1, $2) RETURNING *;`;
    const response = await client.query(SQL, [name, department_id]);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});

server.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees WHERE id=$1`;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

server.put("/api/employees/:id", async (req, res, next) => {
  try {
    const { name, department_id } = req.body;
    const SQL = `UPDATE employees SET name=$1, department_id=$2, updated_at=now() WHERE id=$3 RETURNING *;`;
    const response = await client.query(SQL, [
      name,
      department_id,
      req.params.id,
    ]);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});


server.use((err, req, res) => {
  res.status(err.statusCode || 500).send({ error: err });
});