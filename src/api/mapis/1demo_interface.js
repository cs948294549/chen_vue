import axios from "@/api/axios"

const op_api = {
  // 测试接口
  test(params, config) {
    return axios.get('/test', { params, ...config })
  }
}

export default op_api
