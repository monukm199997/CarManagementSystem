document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Logout button
         */
        const logoutButton =
            document.getElementById("logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }


        /*
         * Current user
         */
        const user =
            getStoredUser();


        /*
         * Username
         */
        const userNameElement =
            document.getElementById("userName");

        if (
            user &&
            userNameElement
        ) {

            userNameElement.textContent =
                user.name;

        }


        /*
         * Role
         */
        const userRoleElement =
            document.getElementById("userRole");

        if (
            user &&
            userRoleElement
        ) {

            userRoleElement.textContent =
                capitalizeRole(user.role);

        }


        /*
         * Role-based UI
         */
        applyRoleBasedUI();

    }
);


/*
 * Capitalize role
 */
function capitalizeRole(role) {

    if (!role) {
        return "";
    }

    return role
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

/*
 * Apply role based UI
 */
function applyRoleBasedUI() {

    const user =
        getStoredUser();

    if (!user) {
        return;
    }


    const roleElements =
        document.querySelectorAll(
            "[data-roles]"
        );


    roleElements.forEach(
        element => {

            const allowedRoles =
                element.dataset.roles
                    .split(",")
                    .map(
                        role => role.trim()
                    );


            if (
                !allowedRoles.includes(
                    user.role
                )
            ) {

                element.classList.add(
                    "d-none"
                );

            } else {

                element.classList.remove(
                    "d-none"
                );

            }

        }
    );

}