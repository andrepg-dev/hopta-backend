import asyncHandler from "@/src/actions/try-catch-async-handler"
import { isAdmin } from "@/src/guards/isAdmin"
import { AppError } from "@/src/handlers/error-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { authMiddleware, UserJWT } from "@/src/middlewares/authMiddleware"
import { validateRequest } from "@/src/middlewares/validate-request"
import { geoModel } from "@/src/schemas/geo.schema"
import { RealStateModel } from "@/src/schemas/real-state.schemas"
import { userModel } from "@/src/schemas/user.schemas"
import Logs from "@/src/services/logs/save-logs.service"
import { getPagination } from "@/src/utils/get-pagination.utils"
import { realStateSchema, realStateUpdateSchema } from "@/src/zod/real-state.zod"
import { RealStateI, RealStateIWithOwner } from "@/types/real-state/types.real-state"
import { Request, Response, Router } from "express"
import mongoose from "mongoose"
import { z } from "zod"

const RealStateRouter = Router()

/**
 * @description get all real state properties available
 */
RealStateRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const sortBy = (req.query.sortBy as string) || "created_at"
    const order = (req.query.order as "asc" | "desc") || "desc"

    const paginatedData = await getPagination({
      limit,
      page,
      Model: RealStateModel,
      sortBy,
      order,
      options: {
        user: req.user,
        pathname: "/"
      }
    })

    if (!paginatedData) throw new AppError("Properties not found", 404)
    responseHandler({
      res,
      code: 200,
      data: paginatedData
    })
  })
)

// this probably dont gonna work
RealStateRouter.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query
    if (!query) throw new AppError("Query is required", 400)

    try {
      const results = await RealStateModel.aggregatePaginate([
        {
          $search: {
            index: "default",
            autocomplete: {
              query: query,
              path: "title",
              fuzzy: { maxEdits: 1 }
            }
          }
        },
        { $limit: 5 }
      ])

      responseHandler({
        res,
        code: 200,
        data: results
      })
    } catch (error) {
      throw new AppError("Error autocompleting properties error: " + error, 500)
    }
  })
)

RealStateRouter.get(
  "/autocomplete-by-location",
  asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query
    if (!query) throw new AppError("Query is required", 400)

    try {
      const result = await geoModel.aggregate([
        {
          $search: {
            index: "default",
            autocomplete: {
              query,
              path: "properties.name",
              fuzzy: {
                maxEdits: 1
              }
            }
          }
        },
        { $limit: 5 }
      ])

      responseHandler({
        res,
        code: 200,
        data: result
      })
    } catch (error) {
      throw new AppError("Error autocompleting properties error: " + error, 500)
    }
  })
)

RealStateRouter.get(
  "/my-properties",
  authMiddleware,
  asyncHandler(async (req: Request<{}, {}, {}, { page: string; limit: string; sortBy: string; order: "asc" | "desc" }>, res: Response) => {
    const user = req.user

    if (!user) throw new AppError("User not found", 404)

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const sortBy = (req.query.sortBy as string) || "created_at"
    const order = (req.query.order as "asc" | "desc") || "desc"

    const paginatedData = await RealStateModel.paginate({ owner: user.userId }, { page, limit, sortBy, order, options: { user: req?.user } })

    responseHandler({
      res,
      code: 200,
      data: paginatedData
    })
  })
)

/**
 * This endpoint is used in the dashboard section from the frontend client.
 */
RealStateRouter.get(
  "/likes",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user

    // Show saved_by properties
    const myProperties = await RealStateModel.find({ owner: user?.userId }).setOptions({ user: req.user }).select("title images saved_by")

    const userInDB = await userModel.findById(user?.userId)

    if (!myProperties) {
      return responseHandler({
        res,
        code: 200,
        message: "You don't have properties yet"
      })
    }

    if (!userInDB) throw new AppError("User not found", 404)

    const properties = myProperties.filter((value) => {
      if (value) {
        if (value.saved_by) {
          return value.saved_by.length > 0
        }
      }

      return null
    })

    let total = 0
    for (let i = 0; i < properties.length; i++) {
      if (properties[i]) {
        const sum = properties[i]?.saved_by?.length || 0
        total += sum
      }
    }

    return responseHandler({
      res,
      code: 200,
      data: { properties, total_saved_by: total },
      message: "Properties with likes retrieved successfully"
    })
  })
)

RealStateRouter.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    console.log({ idTomado: id })

    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid property ID", 400)

    // Verify if the property exists
    const property = await RealStateModel.findById(id)
      .populate("owner", "name last_name email phone contact profile_picture created_at social_media about")
      .setOptions({ user: req.user })

    if (!property) throw new AppError("Property not found", 404)

    const { isVisit } = req.query
    property.increaseVisit({ req, decoded: req?.user, id, isVisit })

    responseHandler({
      res,
      code: 200,
      data: property
    })
  })
)

RealStateRouter.post(
  "/",
  authMiddleware,
  validateRequest(realStateSchema),
  asyncHandler(async (req: Request<{}, {}, RealStateI, {}>, res: Response) => {
    const { body } = req
    const {
      title,
      description,
      price,
      house_features,
      images,
      house_status,
      location,
      square_meters,
      currency,
      population,
      additional_cost,
      one_month_upfront,
      property_type
    } = body

    const owner = req?.user?.userId

    if (!owner) {
      throw new AppError("Not authorized", 401)
    }

    const foundUser = await userModel.findById(owner)
    if (!foundUser) {
      throw new AppError("User not found", 404)
    }

    try {
      // Validar que las imágenes sean URLs válidas
      if (!images || images.length < 3) {
        throw new AppError("At least 3 images are required", 400)
      }

      // Validar que las coordenadas sean válidas
      if (!location?.coordinates[0] || !location?.coordinates[1]) {
        throw new AppError("Location coordinates are required", 400)
      }

      // Validar que el precio sea positivo
      if (!price || price <= 0) {
        throw new AppError("Price must be greater than 0", 400)
      }

      const property = await RealStateModel.create({
        price,
        location,
        house_status: house_status || { is_available: true, is_sold: false },
        house_features,
        population,
        currency,
        square_meters,
        description,
        images,
        title,
        owner,
        stats: { total_visits: 0, total_saves: 0 },
        rating_summary: { average_rating: 0, total_ratings: 0 },
        visitors: [],
        saved_by: [],
        ratings: [],
        additional_cost: additional_cost || { utilities_included: [], water: null, electricity: null },
        one_month_upfront,
        property_type
      })

      // Actualizar el usuario con la nueva propiedad
      await userModel.updateOne({ _id: owner }, { $push: { properties: property._id } })

      // Log de la creación exitosa
      new Logs({
        method: "saveLogs",
        message: `Property created successfully: ${title} by user ${owner}`
      })

      responseHandler({
        res,
        code: 201,
        message: "Propiedad creada exitosamente",
        data: property
      })
    } catch (error: any) {
      console.error("Error creating property:", error)

      // Si es un error de validación de Mongoose
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message)
        throw new AppError(`Validation error: ${validationErrors.join(", ")}`, 400)
      }

      // Si es un error de duplicación
      if (error.code === 11000) {
        throw new AppError("Ya existe una propiedad con estos datos", 409)
      }

      // Error general
      throw new AppError(error.message || "Error interno del servidor al crear la propiedad", 500)
    }
  })
)

RealStateRouter.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid property ID", 400)

    const { user } = req as any
    const { userId: owner } = user

    const foundUser = await userModel.findById(owner)
    if (!foundUser) throw new AppError("User not found", 404)

    const property = (await RealStateModel.findById(id).setOptions({ user: req.user })) as unknown as RealStateIWithOwner
    if (!property) throw new AppError("Property not found", 404)

    new Logs({
      method: "saveLogs",
      message: property
    })

    if (property.owner.toString() !== owner) throw new AppError("You are not the owner of this property", 403)

    const deletedProperty = await RealStateModel.findByIdAndDelete(id, { user: req?.user })
    if (!deletedProperty) throw new AppError("Property not found", 404)

    await userModel.updateOne({ _id: (deletedProperty as unknown as RealStateIWithOwner).owner }, { $pull: { properties: id } })

    responseHandler({
      res,
      code: 200,
      message: "Property deleted successfully"
    })
  })
)

RealStateRouter.put(
  "/:id",
  authMiddleware,
  validateRequest(realStateUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) throw new AppError("Property ID is required", 400)
    if (!req.body) throw new AppError("No data to update", 400)

    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid property ID", 400)

    // Verify property exists and user has permission to update it
    const property = (await RealStateModel.findById(id).setOptions({ user: req.user }).lean()) as RealStateIWithOwner
    if (!property) throw new AppError("Property not found", 404)

    // Optional: Check if user is the owner
    const { userId } = req.user as UserJWT
    if (property.owner.toString() !== userId) {
      throw new AppError("Not authorized to update this property", 403)
    }

    // Prohibed fields to update
    const blocked = ["owner", "created_at", "updated_at", "visitors", "saved_by", "ratings", "stats", "rating_summary"]
    if (blocked.some((field) => req.body[field])) {
      throw new AppError(`Not allowed to update these fields: ${blocked.join(", ")}`, 400)
    }

    const updatedProperty = await RealStateModel.findByIdAndUpdate(
      id,
      {
        ...req.body
      },
      {
        new: true,
        runValidators: true,
        user: req?.user
      }
    ).setOptions({ user: req.user })

    responseHandler({
      res,
      data: updatedProperty,
      code: 200,
      message: "Property updated successfully"
    })
  })
)

// Show real state by array of object ids
const recommendedPropertySchema = z.object({
  property_ids: z.array(z.string().min(1).max(100))
})

RealStateRouter.post(
  "/show-by-ids",
  authMiddleware,
  validateRequest(recommendedPropertySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { property_ids } = req.body
    if (!property_ids) throw new AppError("Property IDs are required", 400)

    const propertyIds = property_ids.map((id: string) => new mongoose.Types.ObjectId(id))
    const properties = await RealStateModel.find({
      _id: { $in: propertyIds }
    })
      .select("-owner -created_at -updated_at -visitors -saved_by -ratings -stats -rating_summary")
      .setOptions({ user: req.user })

    const propertiesMap = new Map(properties.map((p: any) => [p._id.toString(), p]))
    const sortedProperties = property_ids.map((id: string) => propertiesMap.get(id)).filter(Boolean)

    if (!sortedProperties) throw new AppError("Properties not found", 404)

    responseHandler({
      res,
      data: sortedProperties,
      code: 200
    })
  })
)

// Creado:
/*
Endpoint a crear 

/real-state

Eliminar propiedad
Modificar propiedad
Crear propiedad y poder modificarle cualquier campo
Mostrar todas las propiedades Limite de 10 propiedades
Buscador de todas las propiedades
*/

// Delete real state
RealStateRouter.delete(
  "/space/:id",
  authMiddleware,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid property ID", 400)

    const property = await RealStateModel.findOne({ _id: id }).setOptions({ user: req.user })
    if (!property) throw new AppError("Property not found", 404)

    const owner = await userModel.findById(property?.owner)
    if (!owner) throw new AppError("Owner not found", 404)

    // remove the property and the owner
    await userModel.updateOne({ _id: owner._id }, { $pull: { properties: id } })
    await RealStateModel.findByIdAndDelete(id).setOptions({ user: req.user })

    responseHandler({
      res,
      code: 200,
      message: "Your admin, role deleted property successfully",
      data: property
    })
  })
)

RealStateRouter.post(
  "/near-by/coordinates",
  validateRequest(z.object({ coordinates: z.array(z.number()).length(2) })),
  asyncHandler(async (req: Request, res: Response) => {
    const { coordinates } = req.body as { coordinates: [number, number] }

    const closerProperty = await RealStateModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: coordinates
          },
          distanceField: "distance"
        }
      },
      {
        $limit: 5
      }
    ])

    responseHandler({ res, code: 200, data: closerProperty, message: "Properties retrieved succesfully" })
  })
)

// Update real state
RealStateRouter.patch(
  "/space/:id",
  authMiddleware,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid property ID", 400)
    const property = await RealStateModel.findByIdAndUpdate(id, req.body, { new: true }).setOptions({ user: req.user })
    if (!property) throw new AppError("Property not found", 404)

    responseHandler({
      res,
      code: 200,
      data: property,
      message: "Your admin, role updated property successfully"
    })
  })
)

RealStateRouter.patch(
  "/space/accept/:id",
  authMiddleware,
  isAdmin,
  validateRequest(z.object({ accept: z.boolean(), id: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, accept } = req.params

    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid property ID", 400)

    const property = await RealStateModel.findByIdAndUpdate(id, { isAccepted: accept }, { new: true }).setOptions({ user: req.user })

    if (!property) throw new AppError("Property not found", 404)

    responseHandler({
      res,
      code: 200,
      data: property,
      message: "Your admin, role updated property successfully"
    })
  })
)

// Create real state
RealStateRouter.post(
  "/space",
  authMiddleware,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    // To assign the owner, I need the id of the user given in the body.
    const property = await RealStateModel.create(req.body)
    if (!property) throw new AppError("Property not created", 404)

    await userModel.updateOne({ _id: req.body.owner }, { $push: { properties: property._id } })

    responseHandler({
      res,
      code: 200,
      data: property,
      message: "Your admin, role created property successfully"
    })
  })
)

export default RealStateRouter
