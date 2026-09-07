const API_BASE_URL = "http://127.0.0.1:8001";


async function apiRequest(endpoint, options = {}) {

    const token =
        localStorage.getItem("access_token");


    const headers = {

        ...(options.body
            ? {
                "Content-Type": "application/json"
            }
            : {}),

        ...(options.headers || {})

    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    let data = null;


    try {

        data = await response.json();

    } catch (error) {

        data = null;

    }


    /*
     * Unauthorized
     */

    if (response.status === 401) {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "user"
        );

        window.location.href =
            "/frontend/login.html";

        return;

    }


    /*
     * API Error
     */

    if (!response.ok) {

        let errorMessage =
            "Something went wrong";


        if (typeof data?.detail === "string") {

            errorMessage =
                data.detail;

        }
        else if (data?.detail) {

            errorMessage =
                JSON.stringify(
                    data.detail
                );

        }
        else if (data?.message) {

            errorMessage =
                typeof data.message === "string"
                    ? data.message
                    : JSON.stringify(
                        data.message
                    );

        }


        throw new Error(
            errorMessage
        );

    }


    return data;
}











// const API_BASE_URL = "http://127.0.0.1:8001";

// async function apiRequest(endpoint, options = {}) {

//     console.log("API URL:", `${API_BASE_URL}${endpoint}`);

//     const token = localStorage.getItem("access_token");

//     const headers = {
//         ...(options.body ? { "Content-Type": "application/json" } : {}),
//         ...(options.headers || {})
//     };

//     if (token) {
//         headers["Authorization"] = `Bearer ${token}`;
//     }

//     const response = await fetch(
//         `${API_BASE_URL}${endpoint}`,
//         {
//             ...options,
//             headers
//         }
//     );

//     console.log("Response URL:", response.url);
//     console.log("Response Status:", response.status);

//     let data = null;

//     try {
//         data = await response.json();
//     } catch (error) {
//         data = null;
//     }

//     if (response.status === 401) {
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("user");
//         window.location.href = "login.html";
//         return;
//     }

//     if (!response.ok) {
//         throw new Error(
//             data?.detail || "Something went wrong"
//         );
//     }

//     return data;
// }