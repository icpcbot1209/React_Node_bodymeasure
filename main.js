const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Allow cross-origin resource sharing
app.use(cors());
app.options("*", cors());

app.use(fileUpload());

//Upload Endpoint
const Upload = require("./controllers/Upload");
app.post("/get-body-measure", Upload.doCalc);

app.use(express.static(`${__dirname}/client/build`));

app.use((req, res) => res.sendFile(`${__dirname}/client/build/index.html`));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}...`));
