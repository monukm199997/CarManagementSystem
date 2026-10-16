const API_BASE_URL = "http://127.0.0.1:8001";


class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}


function clearStoredAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
}


function getApiErrorMessage(data, fallback = "Something went wrong.") {
    if (typeof data?.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data?.detail)) {
        return data.detail
            .map(item => item.msg || JSON.stringify(item))
            .join(", ");
    }

    if (data?.detail) {
        return JSON.stringify(data.detail);
    }

    if (typeof data?.message === "string") {
        return data.message;
    }

    return fallback;
}


async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");

    const headers = {
        ...(options.headers || {})
    };

    const isFormData =
        typeof FormData !== "undefined" &&
        options.body instanceof FormData;

    if (options.body && !isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        throw new Error(
            "Unable to connect to the server. Check that the backend is running."
        );
    }

    // Handle JSON responses and empty responses such as HTTP 204.
    let data = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch {
            data = null;
        }
    }

    // Invalid or expired authentication.
    // Do not redirect on login/register failures.
    const isAuthEntryPoint =
        /^\/auth\/(login|register|register-company)(\/|$)/.test(endpoint);

    if (response.status === 401 && !isAuthEntryPoint) {
        clearStoredAuth();

        if (!window.location.pathname.endsWith("/login.html")) {
            window.location.href = "/frontend/login.html";
        }

        throw new ApiError(
            getApiErrorMessage(data, "Your session has expired. Please log in again."),
            401,
            data
        );
    }

    // 403 means forbidden; it does not automatically mean the token expired.
    if (!response.ok) {
        throw new ApiError(
            getApiErrorMessage(data, `Request failed (${response.status}).`),
            response.status,
            data
        );
    }

    return data;
}











// const API_BASE_URL = "http://127.0.0.1:8001";


// async function apiRequest(endpoint, options = {}) {

//     const token =
//         localStorage.getItem("access_token");


//     const headers = {

//         ...(options.body
//             ? {
//                 "Content-Type": "application/json"
//             }
//             : {}),

//         ...(options.headers || {})

//     };


//     if (token) {

//         headers["Authorization"] =
//             `Bearer ${token}`;

//     }


//     const response = await fetch(
//         `${API_BASE_URL}${endpoint}`,
//         {
//             ...options,
//             headers
//         }
//     );


//     let data = null;


//     try {

//         data = await response.json();

//     } catch (error) {

//         data = null;

//     }


//     /*
//      * Unauthorized
//      */

//     if (response.status === 401) {

//         localStorage.removeItem(
//             "access_token"
//         );

//         localStorage.removeItem(
//             "user"
//         );

//         window.location.href =
//             "/frontend/login.html";

//         return;

//     }


//     /*
//      * API Error
//      */

//     if (!response.ok) {

//         let errorMessage =
//             "Something went wrong";


//         if (typeof data?.detail === "string") {

//             errorMessage =
//                 data.detail;

//         }
//         else if (data?.detail) {

//             errorMessage =
//                 JSON.stringify(
//                     data.detail
//                 );

//         }
//         else if (data?.message) {

//             errorMessage =
//                 typeof data.message === "string"
//                     ? data.message
//                     : JSON.stringify(
//                         data.message
//                     );

//         }


//         throw new Error(
//             errorMessage
//         );

//     }


//     return data;
// }









