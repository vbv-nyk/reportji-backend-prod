
import passport from "passport" 
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {config} from 'dotenv'
import { pool } from "../database/postgres-config.js";
config({ path: `.env.${process.env.CURRENT_MODE}` });
 

export const initializePassport = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_SUCCESS_CALLBACK_URI
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const data = await pool.query(`insert into users (user_id, username) 
          values ($1, $2);
        `, [profile.id, profile.displayName]);
      // console.log(data);
    } catch(e) {
        // console.log("Error", e, "occurred");
    }
    return cb(null, profile);
  }));

  passport.serializeUser((user, done) => {
    process.nextTick(() => {
      return done(null, user);
    });
  });

  passport.deserializeUser((user, done) => {
    process.nextTick(() => {
      return done(null, user);
    });
  });
};


export const isAuthenticated = (req,res,next) => {
  if(req.isAuthenticated()) {
    // console.log("User is authenticated");
    next();
  } else {
    // console.log("User is not authenticated");
    res.status(401).json({message: 'unauthorized'});
  }
}