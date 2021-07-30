require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
var bodyParser = require("body-parser");
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log('error connecting mongoose');
  console.log(e);
}
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);
const shortURLSchema = new Schema({
  url: String,
  shortUrl: Number,
});
const ShortUrl = mongoose.model("ShortUrl", shortURLSchema);
const options = {
  all: true

};
// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
app.post("/api/shorturl", (req, res) => {
 
  const hostname = req.body.url
    .replace(/http[s]?\:\/\//, '')
    .replace(/\/(.+)?/, '');

  dns.lookup(hostname, options, (err, address, family) => {

    if (!address) {
      res.json({
        error: 'invalid URL'
      });
    } else {
      ShortUrl.findOne({ url: req.body.url }, (findOneErr, dbShortUrl) => {
        if(findOneErr){
          console.error(findOneErr);

        }

        if (!dbShortUrl) {
           ShortUrl.estimatedDocumentCount((countErr, count) => {
         
const shortUrlTmp = new ShortUrl({
              url: req.body.url,
              shortUrl: count + 1
            });
         
         shortUrlTmp.save((saveErr, urlSaved) => {
            
              res.json({
                originalURL: urlSaved.url,
                shortURL: urlSaved.shortUrl
              });
            
            });
           });
        }else{
           res.json({
                originalURL: dbShortUrl.url,
                shortURL: dbShortUrl.shortUrl
              });
        }
      });
    }
  });

});

app.get("/api/shorturl/:short",  (req, res) => {
   ShortUrl.findOne({ shortUrl: req.params.short },(err, dbShortUrl) => {
    if (err) {
      console.error(err);
    }
    if (!dbShortUrl) {
      res.json({
        error: 'no matching URL'
      });
    } else {
      res.redirect(dbShortUrl.url);
    }
	});

});