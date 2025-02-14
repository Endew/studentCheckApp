const knex = require("knex")({
    client: "mysql",
    connection: {
        host: "http://localhost:3001/",
        port: 3306,
        user: "root",
        password: "",
        database: "studentcheck",
    },
});

module.exports = knex;