import { getCookie } from "@/@core/utils/helpers";
import axios from "axios";

const url = `${import.meta.env.VITE_API_BASE_URL}/api`;

const axiosInstance = axios.create({
  baseURL: url,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      if (token) {
        promise.config.headers = promise.config.headers || {};
        promise.config.headers["Authorization"] = `Bearer ${token}`;
      }
      promise.resolve(axiosInstance(promise.config));
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookie("access_token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            config: originalRequest,
            resolve,
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const token = localStorage.getItem("access_token");

        if (!refreshToken || !token) {
          window.location.href = "/login";
          return;
        }

        const response = await axios.post(
          `${url}/refresh`,
          {},
          {
            headers: {
              "Refresh-Token": refreshToken,
            },
          }
        );

        const newAccessToken = response.data.data.access_token;
        const newRefreshToken = response.data.data.refresh_token;

        localStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("refresh_token", newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        window.location.href = import.meta.env.VITE_PORTAL_URL;

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
