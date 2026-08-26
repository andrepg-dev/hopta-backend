import "dotenv/config"
import mongoose from "mongoose"
import { CONNECTIONS } from "../constants/connection.constants"
import { RealStateModel } from "../src/schemas/real-state.schemas"
import { userModel } from "../src/schemas/user.schemas"

const region = process.env.AWS_REGION || "us-east-2"
const bucketName = process.env.AWS_BUCKET_NAME || "hopta-bucket"

const oldHostPattern = `${bucketName}.s3.amazonaws.com`
const newHost = `${bucketName}.s3.${region}.amazonaws.com`

async function migrate() {
  const connectionString = `mongodb+srv://admin:${CONNECTIONS.PASSWORD}@hopta.g94msvw.mongodb.net/${CONNECTIONS.DATABASE_NAME}?retryWrites=true&w=majority&appName=hopta`

  console.log(`Connecting to MongoDB database: ${CONNECTIONS.DATABASE_NAME}...`)
  await mongoose.connect(connectionString)
  console.log("Connected successfully.\n")

  console.log(`Replacing pattern: "${oldHostPattern}" -> "${newHost}"`)
  console.log("--------------------------------------------------")

  // 1. Migrate RealState images
  console.log("1. Checking RealState properties...")
  const properties = await RealStateModel.find({
    images: { $regex: oldHostPattern }
  })

  console.log(`Found ${properties.length} properties with outdated S3 URLs.`)

  let updatedPropertiesCount = 0
  for (const property of properties) {
    let modified = false
    const updatedImages = property.images.map((imgUrl) => {
      if (imgUrl.includes(oldHostPattern)) {
        modified = true
        return imgUrl.replace(oldHostPattern, newHost)
      }
      return imgUrl
    })

    if (modified) {
      await RealStateModel.updateOne(
        { _id: property._id },
        { $set: { images: updatedImages } }
      )
      updatedPropertiesCount++
    }
  }
  console.log(`Updated ${updatedPropertiesCount} RealState documents.\n`)

  // 2. Migrate User profile pictures
  console.log("2. Checking User profile pictures...")
  const users = await userModel.find({
    profile_picture: { $regex: oldHostPattern }
  })

  console.log(`Found ${users.length} users with outdated profile pictures.`)

  let updatedUsersCount = 0
  for (const user of users) {
    if (user.profile_picture && user.profile_picture.includes(oldHostPattern)) {
      const newPic = user.profile_picture.replace(oldHostPattern, newHost)
      await userModel.updateOne(
        { _id: user._id },
        { $set: { profile_picture: newPic } }
      )
      updatedUsersCount++
    }
  }
  console.log(`Updated ${updatedUsersCount} User documents.\n`)

  console.log("--------------------------------------------------")
  console.log("Migration completed successfully!")
  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch((err) => {
  console.error("Migration error:", err)
  mongoose.disconnect()
  process.exit(1)
})
