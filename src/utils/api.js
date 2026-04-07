import { data } from "react-router-dom";

// utils/api.js
const API_BASE_URL = "http://192.168.1.3:5045";

// Auth fetch helper for authenticated requests
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      "Authorization": `Bearer ${token}`,
    },
  });
};

// Login function
export const login = async (username, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/ims/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    console.log(data);

    if (data.status_code === 200) {
      // Store user data
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("tenant_id", data.tenant_id);
      
      return {
        success: true,
        data: {
          username,
          role: data.role,
          tenant_id: data.tenant_id,
          access_token: data.access_token
        }
      };
    } else {
      return {
        success: false,
        error: data.error || "Login failed"
      };
    }
  } catch (error) {
    console.error("Login API error:", error);
    return {
      success: false,
      error: "Network error. Please check your connection."
    };
  }
};
console.log(data);

// Logout function
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("currentPath");
  localStorage.removeItem("sidebarOpenIndex");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem("role");
};

// Get tenant ID
export const getTenantId = () => {
  return localStorage.getItem("tenant_id");
};