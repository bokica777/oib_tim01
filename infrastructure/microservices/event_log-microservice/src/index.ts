import "reflect-metadata";
import dotenv from "dotenv";
import app from "./app";

dotenv.config({ quiet: true });

const port = Number(process.env.PORT || 5560);

app.listen(port, () => {
  console.log(`Audit log microservice running on port ${port}`);
});