function handleCredentialResponse(response) {
    try {
        const data = parseJwt(response.credential);

        // LOGGING: Explicitly log the email to verify "accept all" behavior
        console.log("Google Sign-In successful for:", data.email);
        console.log("Full User Data:", data);

        // NOTE: We are NOT filtering any emails here. 
        // All valid Google accounts are accepted by this frontend code.
        // If an email is rejected, it is likely due to the Google Cloud Console "Testing" mode restrictions.

        localStorage.setItem("nutriroot_user", JSON.stringify({
            name: data.name,
            email: data.email,
            picture: data.picture
        }));

        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Error processing Google Sign-In:", error);
        alert("There was an error signing in with Google. Please try again.");
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
