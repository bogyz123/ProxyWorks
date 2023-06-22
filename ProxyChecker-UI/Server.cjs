const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
app.use(express.static(path.join(__dirname, "./public")));

app.use(cors({
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

app.get("/", (req, res) => {
    res.render("index");
});
app.get("/:param(*)", (req, res) => {
    const path = req.path.substring(1); // we remove '/' to match any param
    res.render("404", { path });
});

app.listen(1337, () => {
    console.log("Server is running on port 1337");
});
