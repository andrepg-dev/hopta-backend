import crypto from 'crypto'

export class RandomIntUtils {
  static randomInt(min = 100000, max = 999999) {
    return crypto.randomInt(min, max).toString()
  }
}

export default RandomIntUtils
