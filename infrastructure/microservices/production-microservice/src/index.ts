// src/server.ts
console.clear();
import app from "./app";
const port = Number(process.env.PORT ?? 9876);
app.listen(port, () => {
  console.log(`\x1b[32m[Production@listen]\x1b[0m port=${port}`);
});
