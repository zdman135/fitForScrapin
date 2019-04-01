var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsScrape";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true});


app.get("/scrape", function(req, res) {
  axios.get("https://www.aljazeera.com/topics/regions/us-canada.html").then(function(response) {
    var $ = cheerio.load(response.data);

    $(".topics-sec-item").each(function(i, element) {
      var result = {};

      result.title = $(this).find('.topics-sec-item-cont').find('.topics-sec-item-head').text();
      result.link = 'https://www.aljazeera.com' + $(this).find('.topics-sec-item-cont').find('a').attr('href');
      result.summary = $(this).find('.topics-sec-item-cont').find('.topics-sec-item-p').text();

      db.Article.create(result).then(function(dbArticle) {
      }).catch(function(err) {
          console.log(err);
      })
    });

    res.redirect('/');
  });
});

app.get("/deleteall", function(req,res) {
  mongoose.connection.db.dropCollection('articles', function(err, result) {
  });
  res.redirect('/');
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
