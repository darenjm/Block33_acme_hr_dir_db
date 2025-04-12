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
        DROP TABLE IF EXISTS department;
        DROP TABLE IF EXISTS employees;
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES categories(id) NOT NULL
        );
        CREATE TABLE department(
             id SERIAL PRIMARY KEY,
             name VARCHAR(255) NOT NULL
        );
        INSERT INTO employees(name, department_id) VALUES('Lugene', (SELECT id FROM categories WHERE name='design'))
        INSERT INTO employees(name, department_id) VALUES('Hali', (SELECT id FROM categories WHERE name='marketing'))
        INSERT INTO employees(name, department_id) VALUES('Derik', (SELECT id FROM categories WHERE name='technology'))

        INSERT INTO department(name) VALUES('technology')
        INSERT INTO department(name) VALUES('marketing')
        INSERT INTO department(name) VALUES('design')
    `;
  await client.query(SQL);

  const port = process.env.PORT || 3030;
  server.listen(port, () => console.log(`listening on port ${port}`));
};

init();

server.use(express.json());
server.use(morgan("dev"));
