// src/server.ts
console.clear();
import app from "./app";
const port = Number(process.env.PORT ?? 9896);
app.listen(port, () => {
  console.log(`\x1b[32m[Storage@listen]\x1b[0m port=${port}`);
});
