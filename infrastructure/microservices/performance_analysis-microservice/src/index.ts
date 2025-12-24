import "reflect-metadata";
import dotenv from "dotenv";
import app from "./app";

dotenv.config({ quiet: true });

const port = Number(process.env.PORT || 5544);

app.listen(port, () => {
  console.log(
    `Performance analysis microservice listening on port ${port}`
  );
});
