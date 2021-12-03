<!-- set JWT token in http request header -->
$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    if(localStorage.getItem('token')) {
        jqXHR.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
    }
});

<!-- print error -->
function printError(response) {
    console.log(response);
    if (response.responseJSON && response.responseJSON.message) {
        let message = response.responseJSON.message;
        if(message == "유효하지 않은 토큰") {
            alert("토큰이 유효하지 않습니다. 로그인 페이지로 이동합니다.")

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("userId");

            window.location.href = "login.html"
        }
        else {
            alert(`상태 코드\n${response.status} ${response.responseJSON.httpStatus}\n\n오류 메시지\n${response.responseJSON.message}`);
        }
    }
    else {
        alert("알 수 없는 에러가 발생했습니다.");
        if($('#article-modal').hasClass('show')) {
            $('#article-modal').modal('hide');
        }
    }
}