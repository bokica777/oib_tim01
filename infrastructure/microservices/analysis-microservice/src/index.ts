console.clear();

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { Db } from "./Database/DbConnectionPool";

const port = process.env.PORT || 6754;

Db.initialize()
  .then(() => {
    console.log("\x1b[36m[DB]\x1b[0m Connected to MySQL");
    app.listen(port, () => {
      console.log(`\x1b[32m[TCPListen@2.1]\x1b[0m localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("\x1b[31m[DB ERROR]\x1b[0m", err);
  });
