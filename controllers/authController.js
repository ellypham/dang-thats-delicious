const passport = require("passport");

// the ability to send passport data and tell us if we should be logged in or not
// this is called a strategy - something that will interface with checking if you're allowed to be logged in
// we're using a local strategy, is going to check if our username and password has been sent in correctly

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed Login!",
  successRedirect: "/",
  successFlash: "You are now logged in",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  // first check if t he user is
  if (req.isAuthenticated()) {
    next(); // carry on! They are logged in
    return;
  }

  req.flash("error", "Oops you must be logged in to do that!");
  res.redirect("/login");
};
