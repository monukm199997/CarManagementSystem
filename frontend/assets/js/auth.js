function getAccessToken() {
    return localStorage.getItem("access_token");
}


function isLoggedIn() {
    return !!getAccessToken();
}


function getStoredUser() {

    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        return null;
    }
}


function getCurrentUserRole() {

    const user = getStoredUser();

    if (!user) {
        return null;
    }

    return user.role;
}


function saveAuthData(token, user = null) {

    localStorage.setItem(
        "access_token",
        token
    );

    if (user) {

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );
    }
}


function clearAuthData() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
}


function logout() {

    clearAuthData();

    window.location.href = "/frontend/login.html";
}


/*
|--------------------------------------------------------------------------
| LOGIN REQUIRED
|--------------------------------------------------------------------------
*/

function requireLogin() {

    if (!isLoggedIn()) {

        window.location.href = "/frontend/login.html";

        return false;
    }

    return true;
}


/*
|--------------------------------------------------------------------------
| ROLE CHECK
|--------------------------------------------------------------------------
*/

function hasRole(...allowedRoles) {

    const role = getCurrentUserRole();

    return allowedRoles.includes(role);
}


/*
|--------------------------------------------------------------------------
| REQUIRE ROLE
|--------------------------------------------------------------------------
*/

function requireRole(...allowedRoles) {

    if (!requireLogin()) {
        return false;
    }

    const role = getCurrentUserRole();

    if (!allowedRoles.includes(role)) {

        window.location.href = "/frontend/unauthorized.html";

        return false;
    }

    return true;
}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

async function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const loginButton =
        document.getElementById("loginButton");

    const errorBox =
        document.getElementById("loginError");


    errorBox.classList.add("d-none");
    errorBox.textContent = "";


    if (!email || !password) {

        errorBox.textContent =
            "Email and password are required.";

        errorBox.classList.remove("d-none");

        return;
    }


    try {

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";


        /*
         * Login API
         */

        const response = await apiRequest(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        /*
         * Save JWT
         */

        localStorage.setItem(
            "access_token",
            response.access_token
        );


        /*
         * Get current user
         */

        const user = await apiRequest(
            "/user/me"
        );

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );


        window.location.href =
            "/frontend/dashboard.html";


    } catch (error) {

        errorBox.textContent =
            error.message || "Login failed.";

        errorBox.classList.remove("d-none");

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
}


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

async function handleRegister(event) {

    event.preventDefault();

    const name =
        document.getElementById("name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const password =
        document.getElementById("password").value;


    const registerButton =
        document.getElementById("registerButton");

    const errorBox =
        document.getElementById("registerError");

    const successBox =
        document.getElementById("registerSuccess");


    errorBox.classList.add("d-none");
    successBox.classList.add("d-none");

    errorBox.textContent = "";
    successBox.textContent = "";


    if (!name || !email || !phone || !password) {

        errorBox.textContent =
            "All fields are required.";

        errorBox.classList.remove("d-none");

        return;
    }


    if (name.length < 2) {

        errorBox.textContent =
            "Name must contain at least 2 characters.";

        errorBox.classList.remove("d-none");

        return;
    }


    if (phone.length < 10 || phone.length > 15) {

        errorBox.textContent =
            "Phone number must contain 10 to 15 characters.";

        errorBox.classList.remove("d-none");

        return;
    }


    if (password.length < 8) {

        errorBox.textContent =
            "Password must contain at least 8 characters.";

        errorBox.classList.remove("d-none");

        return;
    }


    try {

        registerButton.disabled = true;
        registerButton.textContent =
            "Creating account...";


        await apiRequest(
            "/auth/register",
            {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    password: password
                })
            }
        );


        successBox.textContent =
            "Account created successfully. Redirecting to login...";

        successBox.classList.remove("d-none");


        document
            .getElementById("registerForm")
            .reset();


        setTimeout(() => {

            window.location.href =
                "/frontend/login.html";

        }, 1500);


    } catch (error) {

        errorBox.textContent =
            error.message || "Registration failed.";

        errorBox.classList.remove("d-none");

    } finally {

        registerButton.disabled = false;

        registerButton.textContent =
            "Create Account";
    }
}


/*
|--------------------------------------------------------------------------
| PAGE INITIALIZATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        const registerForm =
            document.getElementById("registerForm");

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegister
            );
        }

    }
);