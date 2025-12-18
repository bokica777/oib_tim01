console.clear();
import app from "./app";

const port = Number(process.env.PORT ?? 9906);

app.listen(port, () => {
  console.log(`\x1b[32m[TCPListen@2.1]\x1b[0m localhost:${port}`);
});
