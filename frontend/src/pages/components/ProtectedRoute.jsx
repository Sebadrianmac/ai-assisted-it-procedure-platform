import {
  useEffect,
  useState,
} from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import api, {
  publicApi,
} from "../../api/api";

import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
} from "../../api/constants";


const ProtectedRoute = ({
  children,
  onUserLoaded,
}) => {
  const [
    isAuthorized,
    setIsAuthorized,
  ] = useState(null);


  const refreshAccessToken = async () => {
    const storedRefreshToken =
      localStorage.getItem(REFRESH_TOKEN);

    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response =
        await publicApi.post(
          "/api/auth/token/refresh/",
          {
            refresh: storedRefreshToken,
          }
        );

      const data =
        response?.data ?? response;

      if (!data?.access) {
        throw new Error(
          "Refresh response does not "
          + "contain access token."
        );
      }

      localStorage.setItem(
        ACCESS_TOKEN,
        data.access
      );

      if (data.refresh) {
        localStorage.setItem(
          REFRESH_TOKEN,
          data.refresh
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Token refresh failed:",
        error.response?.data || error
      );

      return false;
    }
  };


  const ensureAccessToken = async () => {
    const accessToken =
      localStorage.getItem(ACCESS_TOKEN);

    /*
     * Access отсутствует.
     */
    if (!accessToken) {
      return refreshAccessToken();
    }

    try {
      const decodedToken =
        jwtDecode(accessToken);

      const expirationTime =
        decodedToken.exp;

      const currentTime =
        Date.now() / 1000;

      /*
       * Access повреждён или истёк.
       */
      if (
        typeof expirationTime !== "number"
        || expirationTime <= currentTime
      ) {
        return refreshAccessToken();
      }

      return true;
    } catch {
      localStorage.removeItem(
        ACCESS_TOKEN
      );

      return refreshAccessToken();
    }
  };


  const authorize = async () => {
    try {
      /*
       * 1. Получаем действующий access.
       */
      const hasAccess =
        await ensureAccessToken();

      if (!hasAccess) {
        throw new Error(
          "No valid authentication token."
        );
      }

      /*
       * 2. Получаем user и permissions.
       */
      const response = await api.get(
        "/api/auth/me/"
      );

      onUserLoaded(response.data);

      /*
       * 3. Только теперь показываем
       * защищённые страницы.
       */
      setIsAuthorized(true);
    } catch (error) {
      console.error(
        "Authorization failed:",
        error.response?.data || error
      );

      localStorage.removeItem(
        ACCESS_TOKEN
      );

      localStorage.removeItem(
        REFRESH_TOKEN
      );

      onUserLoaded(null);
      setIsAuthorized(false);
    }
  };


  useEffect(() => {
    authorize();
  }, []);


  if (isAuthorized === null) {
    return (
      <p>Checking authentication...</p>
    );
  }


  if (!isAuthorized) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  return children;
};


export default ProtectedRoute;