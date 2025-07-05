import axios from 'axios';
const listeners = new Set();
let currentUser = null; 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getInitialUser = () => {
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    } catch (e) {
        console.error("AuthService: Failed to parse currentUser from localStorage on init.", e);
        localStorage.removeItem('currentUser'); 
    }
    return null;
};

currentUser = getInitialUser();

const authService = {
    
    getUser: () => currentUser,

    isAuthenticated: () => !!currentUser,

    setUser: (user) => {
        if (user) {
            currentUser = user;
            try {
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('accessToken', user.accessToken); 
                console.log("AuthService: User data saved to localStorage and state updated.");
            } catch (e) {
                console.error("AuthService: Error saving user to localStorage:", e);
            }
        } else {

            authService.logout();
        }

        listeners.forEach(callback => callback(currentUser));
    },

    logout: () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
        console.log("AuthService: User logged out, data cleared from localStorage and state.");

        listeners.forEach(callback => callback(null));
    },

    subscribe: (callback) => {
        listeners.add(callback);
        callback(currentUser);
        return () => listeners.delete(callback); 
    },
    refreshUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn("AuthService: No access token found for refreshing user. Logging out.");
            authService.logout(); 
            return null;
        }

        try {
            const response = await axios.get(`${BACKEND_URL}/api/v2/users/current-user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedUserData = response.data.data;
            const currentAccessToken = localStorage.getItem('accessToken');
            const userToStore = {
                ...updatedUserData,
                accessToken: currentAccessToken 
            };

            currentUser = userToStore; 
            localStorage.setItem('currentUser', JSON.stringify(userToStore)); 

            console.log("AuthService: User data refreshed successfully.");
            listeners.forEach(callback => callback(currentUser));
            return currentUser;
        } catch (error) {
            console.error("AuthService: Failed to refresh user data:", error.response?.data || error.message);
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log("AuthService: Token unauthorized.");
                authService.logout();
            } else {
                console.warn("Non-auth error during refresh.");
            }
            return null;
        }
    }
};

export default authService;
