import { Request, Response } from "express";

export function HelloWorld(req: Request, res: Response) {
  res.send("Hola mundo")
}