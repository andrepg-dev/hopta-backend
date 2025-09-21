import mongoose from 'mongoose'

export const geoSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'Feature',
  },
  properties: {
    _id: {
      type: String,
      alias: '@id',
    },
    admin_level: {
      type: String,
      default: '10',
    },
    boundary: {
      type: String,
      default: 'administrative',
    },
    name: {
      type: String,
      required: false,
    },
    alt_name: {
      type: String,
      required: false,
    },
    place: {
      type: String,
      default: 'quarter',
    },
    type: {
      type: String,
      default: 'boundary',
    },
    geometry: {
      type: String,
      default: 'center',
      alias: '@geometry',
    },
  },
  geometry: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere',
    },
  },
  id: {
    type: String,
    required: true,
  },
})

export const geoModel = mongoose.model('geo', geoSchema)