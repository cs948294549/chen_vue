import axios from "../axios"
// 先知告警

export default {
  test (data, params) {
    return axios.post("/test", data, params)
  },
  ocrImage (data, params) {
    return axios.post("/ocr_image", data, params)
  },
}
