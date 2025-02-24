import { AppError } from '@/src/handlers/error-handler'
import { userModel } from '@/src/models/user.models'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'


passport.use(
  new GoogleStrategy({
    clientID: '',
    clientSecret: '',
    callbackURL: '',
  }, async (accessToken, refreshToken, profile, done) => {
    if (!profile.emails) return done(new AppError('No email found', 400))

    console.log('[*] Saving user in the database'.blue)

    let user = await userModel
      .create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: accessToken.slice(0, 15),
        provider: 'google',
        is_verified: true
      })
      .catch((err) => {
        throw new AppError('User already exists', 404)
      })

    console.log('[*] User saved in the database'.green)
    console.log(user)
  })
)

passport.serializeUser((user: any, done: any) => {
  done(null, user._id)
})

passport.deserializeUser((id: any, done: any) => {
  userModel.findById(id, (err: any, user: any) => {
    done(err, user)
  })
})
