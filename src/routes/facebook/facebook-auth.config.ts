import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID || '',
  clientSecret: process.env.FACEBOOK_APP_SECRET || '',
  callbackURL: '/oauth2/redirect/facebook',
  state: true
}, function verify(accessToken, refreshToken, profile, cb) {
  console.log(profile)
  return cb(null, profile)
}));

