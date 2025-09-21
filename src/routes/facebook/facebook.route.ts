import { Router } from 'express';
import passport from 'passport';

const facebookRouter = Router()

facebookRouter.get('/', passport.authenticate('facebook'))

facebookRouter.get('/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/')
});


export default facebookRouter
