import { AppError } from '@/src/handlers/error-handler'
import { userModel } from '@/src/schemas/user.schemas'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || ''
    },
    async (_, __, profile, done) => {
      if (!profile.emails) return done(new AppError('No email found', 400))

      try {
        const foundUser = await userModel.findOne({ email: profile.emails[0].value })
        if (foundUser) {
          return done(null, foundUser)
        }

        const newUser = await userModel
          .create({
            name: profile.name?.givenName || '',
            last_name: profile.name?.familyName || '',
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

        return done(null, newUser)
      } catch (error) {
        return done(error as Error)
      }
    }
  )
)

passport.serializeUser((user: any, done: any) => {
  done(null, user._id)
})

passport.deserializeUser((id: any, done: any) => {
  userModel.findById(id, (err: any, user: any) => {
    done(err, user)
  })
})
