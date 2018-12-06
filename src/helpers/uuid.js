const rnds8 = new Uint8Array(16)
const getRandomValues =
  (typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
  (typeof msCrypto != 'undefined' &&
    typeof window.msCrypto.getRandomValues == 'function' &&
    msCrypto.getRandomValues.bind(msCrypto))
/**
 * @return {*}
 */
function rng() {
  getRandomValues(rnds8)
  return rnds8
}

const byteToHex = []
for (let i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1)
}

/**
 * bytesToUuid
 * @param {*} buf
 * @param {*} offset
 * @return {*}
 */
function bytesToUuid(buf, offset) {
  let i = offset || 0
  const bth = byteToHex
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return [
    bth[buf[i++]],
    bth[buf[i++]],
    bth[buf[i++]],
    bth[buf[i++]],
    '-',
    bth[buf[i++]],
    bth[buf[i++]],
    '-',
    bth[buf[i++]],
    bth[buf[i++]],
    '-',
    bth[buf[i++]],
    bth[buf[i++]],
    '-',
    bth[buf[i++]],
    bth[buf[i++]],
    bth[buf[i++]],
    bth[buf[i++]],
    bth[buf[i++]],
    bth[buf[i++]],
  ].join('')
}

/**
 * uuid/v4
 * @param {*} options
 * @param {*} buf
 * @param {*} offset
 * @return {*}
 */
export default function v4(options, buf, offset) {
  const i = (buf && offset) || 0

  if (typeof options == 'string') {
    buf = options === 'binary' ? new Array(16) : null
    options = null
  }
  options = options || {}

  const rnds = options.random || (options.rng || rng)()

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40
  rnds[8] = (rnds[8] & 0x3f) | 0x80

  // Copy bytes to buffer, if provided
  if (buf) {
    for (let ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii]
    }
  }

  return buf || bytesToUuid(rnds)
}
