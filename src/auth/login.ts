import express from "express";
import passport from "passport";
import {config} from 'dotenv'
config({ path: `.env.${process.env.CURRENT_MODE}` });
export const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

router.get("/details", (req, res) => {
  if (!req.isAuthenticated()) {
    // console.log("User is not logged in");
    res.json({
      loggedIn: false,
    });
    return;
  }

    // console.log("User is logged in");
  res.json({
    data: req.user,
  });
});

router.get(
  "/google/success",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to frontend with user info or token.
    res.redirect(process.env.CLIENT_URL);
  }
);
