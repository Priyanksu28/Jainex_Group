import axios from 'axios';

const API = axios.create({
    // Accessing Vite environment variable
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add a request interceptor to attach the token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;