import axios from "axios"

export interface IpInfo {
  status: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
  query: string
}

export async function getIpInfo(ip: string | undefined) {
  if (!ip) return
  const response = await axios.get<IpInfo>(`http://ip-api.com/json/${ip}`)

  const data = {
    // status: response.data.status,
    country: response.data.country,
    countryCode: response.data.countryCode,
    // region: response.data.region,
    regionName: response.data.regionName,
    city: response.data.city,
    zip: response.data.zip,
    lat: response.data.lat,
    lon: response.data.lon,
    timezone: response.data.timezone
    // isp: response.data.isp,
    // org: response.data.org,
    // as: response.data.as,
    // query: response.data.query
  }

  return data
}
