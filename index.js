const Promise = require("bluebird");
const express = require("express");
const pgp = require("pg-promise")({
  promiseLib: Promise
})
const bodyParser = require('body-parser');
const app = express();
const db = pgp({
  database: "restaurant_db"
});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get("/", function(req, res){
  res.render("home.hbs", {
    title: "Restaurant Reviewer"
  })
})

app.get("/search_result", function(req, res, next){
  var name = req.query.name;
  db.any(`select * from restaurant where name ilike '%${name}%'`)
    .then(function(restaurants){
      res.render("search_result.hbs", {
        restaurants: restaurants
      });
    })
    .catch(next);
})

app.get("/restaurant/:id", function(req, res, next){
  var id = req.params.id;
  db.one(`select * from restaurant where id = ${id}`)
    .then(function(restaurant){
      return[restaurant, db.any(`select reviewer.name, review.title, review.review, review.stars from review join reviewer on reviewer.id = review.reviewer_id where review.restaurant_id = ${id}`)]
    })
    .spread(function(restaurant,reviews){
      res.render("restaurant.hbs", {
        restaurant: restaurant,
        reviews: reviews
      });
    })
    .catch(next);
})

app.post('/submit_review/:id', function(req, res, next){
  var id = req.params.id;
  var title = req.body.title;
  var review = req.body.review;
  var stars = Number(req.body.stars);
  db.none(`insert into review values (default, NULL, ${stars} ,'${title}','${review}',${id})`)
    .then(function(){
      res.redirect(`/review_submit`);
    })
    .catch(next)
})

app.get("/review_submit", function(req, res){
  res.render("review_submit.hbs", {
    title: "thanks for submitting"
  });
})

app.post('/submit_add_new_restaurant', function(req, res, next){
  var name = req.body.name;
  var address = req.body.address;
  var category = req.body.category;
  db.none(`insert into restaurant values (default, '${name}' ,'${address}','${category}')`)
    .then(function(){
      res.redirect(`/add_new_restaurant_submit`);
    })
    .catch(next)
})

app.get("/add_new_restaurant_submit", function(req, res){
  res.render("add_new_restaurant_submit.hbs", {
    title: "thanks for submitting"
  });
})

app.listen(3002, function(){
  console.log("listening from 3002")
})
