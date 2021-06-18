require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const server = express();

server.use(express.json());
server.use(cors());

const BASEURI = "/api/projects";

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "sql4.freemysqlhosting.net",
  user: process.env.DB_USER || "sql4419467",
  password: process.env.DB_PASSWORD || "uVqSI8mGSE",
  database: process.env.DATABASE || "sql4419467",
});

const checkProjectExistence = (request, response, next) => {
  const id = +request.params.id;
  if (isNaN(id)) {
    return response.status(404).json({ error: "Projects not found" });
  }
  connection.query("SELECT * FROM projects WHERE ID=?", id, (error, result) => {
    if (error) {
      return response.status(500).json({ error: "Internal error" });
    }
    if (result.length === 0) {
      return response.status(404).json({ error: "Projects not found" });
    }
    request.project = result;
    next();
  });
};

const validateBody = (req, res, next) => {
  const values = [req.body.NAME, req.body.DESCRIPTION, req.body.IMAGE];
  if (values.some((value) => value.length === 0)) {
    return res.status(422).json({ message: "Please fill correctly fields" });
  }
  next();
};

connection.connect((error) => {
  if (error) {
    return console.error("connection failure : ", error.stack);
  }
  console.log("successful connecting to the database");
});

server.get(`${BASEURI}/`, (request, response) => {
  connection.query("SELECT * FROM projects", (error, result) => {
    if (error) {
      response.status(500).json({ error: "Internal error" });
    }
    response.status(200).json({ result });
  });
});

server.get(`${BASEURI}/:id`, checkProjectExistence, ({ project }, response) => {
  response.status(200).json(project);
});

server.post(
  `${BASEURI}/`,
  validateBody,
  ({ body: { NAME, DESCRIPTION, IMAGE } }, response) => {
    connection.query(
      "INSERT INTO projects (NAME,DESCRIPTION,IMAGE) VALUE (?,?,?)",
      [NAME, DESCRIPTION, IMAGE],
      (error) => {
        if (error) {
          response.status(500).json({ error: "Internal error" });
        }
        response.status(200).json({ message: "successfully inserted" });
      }
    );
  }
);

server.put(
  `${BASEURI}/:id`,
  checkProjectExistence,
  validateBody,
  ({ params: { id }, body: { NAME, DESCRIPTION, IMAGE } }, response) => {
    connection.query(
      "UPDATE projects SET NAME=?, DESCRIPTION=?, IMAGE=? WHERE ID= ?",
      [NAME, DESCRIPTION, IMAGE, id],
      (error) => {
        if (error) {
          response.status(500).json({ error: "Internal error" });
        }
        response.status(200).json({ message: "successfully updated" });
      }
    );
  }
);

server.delete(
  `${BASEURI}/:id`,
  checkProjectExistence,
  ({ params: { id } }, response) => {
    connection.query("DELETE FROM projects WHERE ID=?", id, (error) => {
      if (error) {
        response.status(500).json({ error: "Internal error" });
      }
      response.status(200).json({ message: "successfully deleted" });
    });
  }
);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`The server is running on : ${PORT}`);
});
