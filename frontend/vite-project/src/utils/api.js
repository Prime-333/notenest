import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://notenest-backend-q7n2.onrender.com",
});

let getTokenFn = null;

export const setAuthTokenGetter = (fn) => {
  getTokenFn = fn;
};

API.interceptors.request.use(async (config) => {
  try {
    if (getTokenFn) {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error("Token error:", error);
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default API;