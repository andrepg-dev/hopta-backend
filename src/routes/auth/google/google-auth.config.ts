import { AppError } from '@/src/handlers/error-handler'
import { userModel } from '@/src/models/user.models'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
  }, async (accessToken, refreshToken, profile, done) => {
    if (!profile.emails) return done(new AppError('No email found', 400))

    console.log('[*] Saving user in the database'.blue)

    let user = await userModel
      .create({
        name: profile.displayName,
        email: profile.emails[0].value,
        auth: {
          google: {
            id: profile.id
          }
        },
        profile_picture: profile.photos?.[0]?.value || ''
      })
      .catch((err) => {
        throw new AppError(err, 404)
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
