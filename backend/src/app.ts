import express from "express";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

const path_to_frontend = path.join(__dirname, "..", "..", "frontend", "build");

app.use(express.static(path.join(path_to_frontend)));
app.get("/", (_req, res) => {
  res.sendFile(path.join(path_to_frontend, "index.html"));
});
app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
