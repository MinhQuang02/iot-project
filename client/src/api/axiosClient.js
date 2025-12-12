import axios from 'axios';

// Create an Axios instance with default configuration
const axiosClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Adjust if your Django server runs on a different port
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach the JWT token to every request if available
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle responses and errors (e.g., token expiration)
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors (Token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const res = await axios.post('http://localhost:8000/api/auth/refresh/', {
                        refresh: refreshToken
                    });

                    if (res.status === 200) {
                        const newAccessToken = res.data.access;
                        localStorage.setItem('access_token', newAccessToken);
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axiosClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error("Session expired", refreshError);
                // Optionally logout user or redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
