const Promise = require("bluebird");
const express = require("express");
const pgp = require("pg-promise")({
  promiseLib: Promise
})
const bodyParser = require('body-parser');
const session = require("express-session");
const db = pgp({
  database: "restaurant_db"
});
const app = express();


app.set("view engine", "hbs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
  secret: "mytopsecret",
  cookie:{
    maxAge: 60000000
  }
}))
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});


app.get("/login", function(req, res){
  res.render("login.hbs", {
    title: "login"
  })
})

app.post("/submit_login", function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  db.any(`select * from reviewer where username = $1`, `${username}`)
    .then(function(users){
      if(users.length===1 && users[0].password===password){
        req.session.username = username;
        req.session.name = users[0].name;
        req.session.userid = users[0].id;
        req.session.isWrong = null;
        res.redirect(req.session.pageurl);
      }else{
        req.session.isWrong = true;
        res.redirect("/login");
      }
    })
})

app.get("/", function(req, res){
  req.session.pageurl = "/";
  res.render("home.hbs", {
    title: "Restaurant Reviewer"
  })
})


app.get("/search_result", function(req, res, next){
  var name = req.query.name.replace(/(\')/g, "\'\'");
  req.session.pageurl = "/search_result?name="+name;
  db.any(`select * from restaurant where name ilike $1`, `%${name}%`)
    .then(function(restaurants){
      res.render("search_result.hbs", {
        restaurants: restaurants
      });
    })
    .catch(next);
})

app.get("/restaurant/new", function(req, res){
  req.session.pageurl = "/restaurant/new";
  res.render("add_new_restaurant.hbs", {
    title: "add a new restaurant"
  })
})


app.get("/restaurant/:id", function(req, res, next){
  var id = req.params.id;
  req.session.pageurl = "/restaurant/"+id;
  db.one(`select * from restaurant where id = $1`, `${id}`)
    .then(function(restaurant){
      return[restaurant, db.any(`select reviewer.name, review.title, review.review, review.stars from review left outer join reviewer on reviewer.id = review.reviewer_id where review.restaurant_id = $1`, `${id}`)]
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
  var reviewerid = req.session.userid;
  var title = req.body.title.replace(/(\')/g, "\'\'");
  var review = req.body.review.replace(/(\')/g, "\'\'");
  var stars = Number(req.body.stars);
  db.none(`insert into review values (default, $1, $2, $3, $4, $5)`, [`${reviewerid}`, `${stars}`,`${title}`,`${review}`,`${id}` ])
    .then(function(){
      res.redirect(`/review_submit`);
    })
    .catch(next)
})

app.get("/review_submit", function(req, res){
  req.session.pageurl = "/review_submit";
  res.render("review_submit.hbs", {
    title: "thanks for submitting"
  });
})


app.post('/submit_add_new_restaurant', function(req, res, next){
  var name = req.body.name.replace(/(\')/g, "\'\'");
  var address = req.body.address.replace(/(\')/g, "\'\'");
  var category = req.body.category.replace(/(\')/g, "\'\'");
  db.none(`insert into restaurant values (default, '${name}' ,'${address}','${category}')`)
    .then(function(){
      res.redirect(`/add_new_restaurant_submit`);
    })
    .catch(next)
})

app.get("/add_new_restaurant_submit", function(req, res){
  req.session.pageurl = "/add_new_restaurant_submit";
  res.render("add_new_restaurant_submit.hbs", {
    title: "thanks for submitting"
  });
})

app.get("/logout", function(req, res){
  req.session.username = null;
  req.session.name = null;
  req.session.userid = null;
  req.session.isWrong = null;
  res.redirect(req.session.pageurl);
})

app.listen(3002, function(){
  console.log("listening from 3002")
})
