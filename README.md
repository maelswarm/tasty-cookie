# tasty-cookie

## Quickstart

Download mongodb.

Run ```mongod --dbpath <path to database>```

Make a new project, and run the example below.

If you actually end up using this module for development purposes, then use HTTPS!

## Database Structure

    database-----collections-----documents
    
    "yourdb"---.
               |---"users"---.
               |             |---"username"               
               |             |---"password"               
               |             |---"cookie"               
               |               
               `---"sessions"---.               
                                |---"stamp"                                
                                |---"cookie"

## Example

```js

const key = "mylittleponymylittlepony";
const dbpath = "mongodb://127.0.0.1:27017/mydb";
const refresh = 5000; // 5 seconds
const cookielifespan = 60000; // 1 minute

const express = require('express');
const TastyCookie require('tasty-cookie');
const bodyParser require('body-parser');
const authentication = express.Router();
const login = express.Router();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

TastyCookie.init(dbpath, key, timeout, cookielifespan);

login.use(function (req, res, next) {
  TastyCookie.login(req.body.un, req.body.pw, function(cookie) {
    req.body.myCookie = cookie;
    next();
  });
});

authentication.use(function (req, res, next) {
  TastyCookie.authenticate(req.body.myCookie, function(e) {
    e ? next() : res.send("Better luck next time!");
  });
});

app.post("/auth", authentication, function(req, res) {
  res.send('You did it!');
});

app.post("/login", login, function(req, res) {
  res.send('Logged in!<form action="/auth" method="post"><input type="hidden" name="myCookie" value="'+req.body.myCookie+'"><input type="submit"></form>');
});

app.get("/", function(req, res) {
  res.send('Hello World!<form action="/login" method="post"><input type="text" name="un" value=""><input type="text" name="pw" value=""><input type="submit"></form>');
});

app.listen(8080, function() {
  console.log("Listening on port 8080!");
});

process.on("SIGINT", function() {
  console.log("\nSIGINT Closing App.");
  TastyCookie.close();
  process.exit();
});
```
