document.addEventListener("DOMContentLoaded", () => {

    /*
     * Protect dashboard
     */
    if (!requireLogin()) {
        return;
    }


    /*
     * Get logged-in user
     */
    const user = getStoredUser();


    /*
     * Welcome username
     */
    const welcomeUser =
        document.getElementById("welcomeUser");

    if (user && welcomeUser) {
        welcomeUser.textContent = user.name;
    }


    /*
     * Sidebar elements
     */
    const sidebar =
        document.getElementById("dashboardSidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");


    /*
     * Open sidebar
     */
    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("show");

                sidebarOverlay.classList.toggle("show");

            }
        );

    }


    /*
     * Close sidebar
     */
    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    /*
     * Sidebar links
     */
    document
        .querySelectorAll(".dashboard-sidebar a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 991
                    ) {
                        closeSidebar();
                    }

                }
            );

        });


    /*
     * Sidebar logout
     */
    const sidebarLogout =
        document.getElementById("sidebarLogout");

    if (sidebarLogout) {

        sidebarLogout.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logout();

            }
        );

    }

});


/*
 * Close sidebar function
 */
function closeSidebar() {

    const sidebar =
        document.getElementById("dashboardSidebar");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.remove("show");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("show");
    }

}