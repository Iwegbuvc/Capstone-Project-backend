const express = require("express");
const bcrypt = require("bcrypt");
const User = require("./config");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
require("dotenv").config();
const app = express();

// Session set-up
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// Passport initialization and configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy for user authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Username not found" });
      }
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (isPasswordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Wrong password" });
      }
    } catch (error) {
      return done(error);
    }
  })
);

// Serialization and deserialization of user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Express setup
app.set("views", "views");
app.set("view engine", "ejs"); // set up ejs as the view engine
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));

// Route for the homepage
app.get("/", (req, res) => {
  res.render("index", { title: "Homepage" });
});

// Route for the login page
app.get("/login", (req, res) => {
  res.render("login", { title: "login page" });
});

// Route for the signup page
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign up" });
});

// Register users
app.post("/signup", async (req, res) => {
  const data = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  };

  try {
    // Check if user exist
    const existUser = await User.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existUser) {
      return res
        .status(409)
        .send({ message: "Username or email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const userData = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });

    res.render("properties", {
      title: "Property Page",
    });
    console.log(userData);
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Login user
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/properties");
  }
);

// Route for the properties page with authentication middleware
app.get("/properties", isLoggedIn, (req, res) => {
  res.render("properties", { title: "propertypage" });
});

// Logout route with session destruction
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({ message: "Internal Server Error" });
    }
    res.redirect("/");
  });
});

// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on localhost: ${PORT}`);
});
