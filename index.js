require("dotenv").config();
const app = require("express")();
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const cors = require("cors");
// import { compress } from "./ffmpeg";
var ffmpeg = require('./ffmpeg.js');

let s3;
let config = {};
s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  signatureVersion: process.env.S3_SIGNATURE_VERSION,
  region: process.env.S3_REGION,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());


/** video serving */
app.get("/viewVideo/:key?", (req, res) => {
  const key = req.params.key;
  if (!!key === false) return res.status(400).send(false);
  const fileExtension = key.split(".").pop().toLowerCase();

  if (fileExtension !== "mp4")
    return res.status(400).send(false);

  const params = { Bucket: process.env.S3_BUCKET, Key: key };
  s3.headObject(params, function (err, data) {
    if (err) {
      console.error(err);
      return res.status(400).send(false);
    }
    var stream = s3.getObject(params).createReadStream();

    // forward errors
    stream.on("error", function error(err) {
      console.log(err.message);
      return res.status(400).send(false);
    });
    //Pipe the s3 object to the response
    stream.pipe(res);
  });
});
/** Upload Files */
app.post("/upload", (req, res) => {
  const { Key, fileType } = req.body;
  console.log(">>>>>>")
  // console.log(req.file.path)
  console.log(req)

  // ffmpeg.compress().then(data => {
  // console.log(data)
  s3.getSignedUrl(
    "putObject",
    {
      Bucket: process.env.S3_BUCKET,
      Key,
      // Body: fileData,
      ContentType: fileType,
      ...config,
    },
    (err, url) => {
      if (err) return res.status(400).send(err);
      res.json({ url });
    }
  );

  // }).catch(err => {
  //   console.log(err)
  //   res.status(400).send(err)
  // })


});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => console.log(`Media Service is running on port ${PORT}`));
