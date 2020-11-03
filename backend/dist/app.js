"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = express_1.default();
const port = 3000;
const path_to_frontend = path_1.default.join(__dirname, "..", "..", "frontend", "build");
app.use(express_1.default.static(path_1.default.join(path_to_frontend)));
app.get("/", (_req, res) => {
    res.sendFile(path_1.default.join(path_to_frontend, "index.html"));
});
app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});
//# sourceMappingURL=app.js.map