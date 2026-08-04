import axios from "axios";

import {
  ACCESS_TOKEN,
} from "./constants";


const baseURL =
  import.meta.env.VITE_API_URL;

export const publicApi = axios.create({
  baseURL,
});


const api = axios.create({
  baseURL,
});


api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem(ACCESS_TOKEN);

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export default api;