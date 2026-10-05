document.addEventListener("DOMContentLoaded", () => {

    loadNotificationPreferences();

    const saveButton = document.getElementById(
        "saveNotificationPreferences"
    );

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveNotificationPreferences
        );
    }

});


async function loadNotificationPreferences() {

    hideMessages();

    try {

        const preferences = await apiRequest(
            "/notifications/preferences"
        );

        console.log(
            "Notification Preferences:",
            preferences
        );

        document.getElementById(
            "documentExpiryToggle"
        ).checked = Boolean(preferences.document_expiry);

        document.getElementById(
            "insuranceExpiryToggle"
        ).checked = Boolean(preferences.insurance_expiry);

        document.getElementById(
            "serviceDueToggle"
        ).checked = Boolean(preferences.service_due);

        document.getElementById(
            "licenseExpiryToggle"
        ).checked = Boolean(preferences.license_expiry);

        applyRoleBasedSettings();

    } catch (error) {

        console.error(
            "Failed to load notification preferences:",
            error
        );

        showSettingsError(
            error.message ||
            "Failed to load notification preferences."
        );
    }
}

async function saveNotificationPreferences() {

    hideMessages();

    const saveButton = document.getElementById(
        "saveNotificationPreferences"
    );

    const originalText = saveButton.innerText;

    saveButton.disabled = true;
    saveButton.innerText = "Saving...";

    const data = {
        document_expiry: document.getElementById(
            "documentExpiryToggle"
        ).checked,

        insurance_expiry: document.getElementById(
            "insuranceExpiryToggle"
        ).checked,

        service_due: document.getElementById(
            "serviceDueToggle"
        ).checked,

        license_expiry: document.getElementById(
            "licenseExpiryToggle"
        ).checked
    };

    try {

        await apiRequest(
            "/notifications/preferences",
            {
                method: "PUT",
                body: JSON.stringify(data)
            }
        );

        showSettingsSuccess(
            "Notification preferences updated successfully."
        );

    } catch (error) {

        showSettingsError(
            error.message || "Failed to update notification preferences."
        );

    } finally {

        saveButton.disabled = false;
        saveButton.innerText = originalText;

    }
}


function applyRoleBasedSettings() {

    let user = null;

    try {

        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            user = JSON.parse(storedUser);
        }

    } catch (error) {

        console.error(
            "Unable to read logged-in user.",
            error
        );

    }

    if (!user) {
        return;
    }

    const role = user.role;

    const licenseSetting = document.getElementById(
        "licenseExpirySetting"
    );

    if (!licenseSetting) {
        return;
    }

    /*
     * Customers do not receive driver license
     * expiry notifications.
     */

    if (role === "customer") {

        licenseSetting.classList.add("d-none");

    } else {

        licenseSetting.classList.remove("d-none");

    }
}


function showSettingsSuccess(message) {

    const successElement = document.getElementById(
        "settingsSuccess"
    );

    successElement.textContent = message;

    successElement.classList.remove("d-none");

}


function showSettingsError(message) {

    const errorElement = document.getElementById(
        "settingsError"
    );

    errorElement.textContent = message;

    errorElement.classList.remove("d-none");

}


function hideMessages() {

    const successElement = document.getElementById(
        "settingsSuccess"
    );

    const errorElement = document.getElementById(
        "settingsError"
    );

    successElement.classList.add("d-none");
    errorElement.classList.add("d-none");

}