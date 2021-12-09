<!-- set JWT token in http request header -->
$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    if(localStorage.getItem('access_token')) {
        jqXHR.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('access_token'));
    }
});

<!-- print error -->
function processError(response) {
    console.log(response);
    if (response.responseJSON && response.responseJSON.message) {
        let message = response.responseJSON.message;
        if(message == "access token is expired") {
            reissueAccessToken();
        }
    }
}

function reissueAccessToken() {
    let tokens = {
        accessToken: localStorage.getItem("access_token"),
        refreshToken: localStorage.getItem("refresh_token")
    };
    localStorage.removeItem("access_token");

    $.ajax({
        type: "POST",
        url: `${WEB_SERVER_DOMAIN}/auth/token`,
        contentType: "application/json",
        data: JSON.stringify(tokens),
        success: function (response) {
            console.log("/auth/token 요청 성공 콜백")
            localStorage.setItem('access_token', response.accessToken);
        }
    })
}