import { Router } from "express";

const stripeRouter = Router()

stripeRouter.get("/", (req, res) => {
  res.send("Hello World")
})

export default stripeRouter
