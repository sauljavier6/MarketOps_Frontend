import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4580/api",
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
    if (apiMessage) error.message = apiMessage;
    return Promise.reject(error);
  },
);
