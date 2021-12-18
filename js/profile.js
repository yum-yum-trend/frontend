const gUserId = localStorage.getItem('userId')
const gProfileUserId = new RegExp('[\?]' + 'userId' + '=([^#]*)').exec(window.location.href)[1]
const gIsMyPage = (gUserId === gProfileUserId);


<!-- set JWT token in http request header -->
$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    if(localStorage.getItem('access_token')) {
        jqXHR.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('access_token'));
    }
});


// localStorage 에 token, username, userId 하나라도 없으면 로그인 페이지로 이동
function checkLoginStatus() {
    if (!localStorage.getItem("access_token") || !localStorage.getItem("username") || !localStorage.getItem("userId")) {
        location.href = 'login.html'
    }
}

// 유저에 따른 프로필 이미지 변경 & 설정 버튼 활성화 여부
function showMyPageSettings() {
    $('#profile-introduction-textarea').hide();
    if (gIsMyPage) {
        let profilePictureButtonActive = `<img id="user-profile-image" class="for-cursor" title="프로필 사진 추가" src="" alt="profile image">
                                                <input class="form-control" type="file" accept="img/*" id="imageFile" name="imageFile" style="display:none;">`
        let settingButtonActive = `<button type="button" id="setting-button" class="btn btn-outline-secondary" data-toggle="modal" data-target="#profile-change-modal">설정</button>`
        let profileTextModifier = ``
        $('#profile-pic').append(profilePictureButtonActive)
        $('#setting-button-div').append(settingButtonActive)
        $('#profile-intro-text').append(profileTextModifier)
    } else {
        let profilePictureButtonInactive = `<img id="user-profile-image" src="" alt="profile image">`
        $('#profile-pic').append(profilePictureButtonInactive)
    }
}

// 변경할 프로필 이미지 업로드
function updateUserProfileImage(newProfileImage) {
    var formData = new FormData();
    formData.append("newProfileImage", newProfileImage);

    $.ajax({
        type: "POST",
        url: `${WEB_SERVER_DOMAIN}/profile/image-change/${gUserId}`,
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function () {
            location.reload();
        },
        error: function (request) {
            alert(`에러가 발생했습니다.\nError Code: ${request.status}\nError Text : ${request.responseText}`)
        }
    })
}

// 프로필 기본 정보 불러오기 (username, intro, 사진)
function showUserProfileInfo(userId) {
    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/profile/${userId}`,
        data : {},
        success : function (response) {
            $('#profile-username').text(response.username);
            $('#profile-email').text(response.email);

            if (response.kakaoId){
                $('#password-to-change-form').hide();
                $('#password-to-change-check-form').hide();
                $('#present-password-form').hide();
            }

            if (response.userProfileIntro) {
                $('#profile-intro-text').text(response.userProfileIntro);
                $('#profile-text-to-change').val(response.userProfileIntro);
            }

            if (response.userProfileImageUrl) {
                $("#user-profile-image").attr("src", response.userProfileImageUrl);
            } else {
                $("#user-profile-image").attr("src", "/images/profile_placeholder.png");
            }
        }
    })
}

// 프로필 사진 초기화
function resetProfileImage(userId) {
    let response = confirm("프로필 사진을 초기화 하시겠습니까?");
    if (response) {
        $.ajax({
            type: "DELETE",
            url: `${WEB_SERVER_DOMAIN}/profile/${userId}`,
            data: {},
            success: function () {
                alert("프로필 사진이 초기화 되었습니다.");
                $('#profile-change-modal').modal('hide');
                location.reload();
            },
            error: function (response) {
                processError(response);
            }
        })
    }
}

// 비밀번호 정규식
function checkPassword(password) {
    let regExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
    return regExp.test(password);
}

// 유저 정보 변경 (비밀번호, 상태 메시지)
function updateUserProfileInfo(userId) {
    let presentPassword = $("#present-password").val();
    let newPassword = $("#password-to-change").val();
    let newPasswordCheck = $("#password-to-change-check").val();


    if (presentPassword === "" && (newPassword !== "" || newPasswordCheck !== "")) {
        return alert("사용중인 비밀번호를 입력해주세요.")
    }

    if (presentPassword !== "" && (newPassword === "" && newPasswordCheck === "")) {
        return alert("변경할 비밀번호를 입력해주세요.")
    }

    if (!checkPassword(newPassword)) {
        return alert("비밀번호는 영문과 숫자 조합으로 8 ~ 16자리 가능.")
    }

    if (newPassword !== newPasswordCheck) {
        return alert("새 비밀번호가 서로 동일하지 않습니다.")
    }

    $.ajax({
        type : "PUT",
        url : `${WEB_SERVER_DOMAIN}/profile/pw/${userId}`,
        contentType: "application/json",
        data: JSON.stringify({
            nowPassword : presentPassword,
            newPassword : newPassword
        }),
        success: function () {
            alert("변경되었습니다.")
            $('#profile-change-modal').modal('hide');
            location.reload();
        },
        error: function (response) {
            if (response.status === 401) {
                console.log(response)
                alert("현재 사용중인 비밀번호를 정확히 입력해주세요.")
            } else {
                processError(response)
            }
        }
    })
}

// 프로필 텍스트창 열기
function openProfileTextarea() {
    $('#profile-text-onscreen').hide()
    $('#profile-introduction-textarea').show()
}

function saveUserProfileIntroText(userId) {
    let newProfileText = $("#profile-text-to-change").val();

    if (newProfileText.length > 100) {
        return alert("상태 메세지는 100자를 넘길 수 없습니다.")
    }

    $.ajax({ /// 상태 메시지 하나 보내는 것입니다 회원님들...
        type : "POST",
        url : `${WEB_SERVER_DOMAIN}/profile/intro/${userId}`,
        contentType: "application/json",
        data: JSON.stringify({userProfileIntro : newProfileText}),
        success : function (response) {
            $('#profile-introduction-textarea').hide()
            $('#profile-text-onscreen').show()
            $('#profile-intro-text').text(response);
            $('#profile-text-to-change').val(response);
        },
        error: function (response) {
            processError(response);
        }
    })
}


// 자신이 작성한 글 보기
function showUserArticles(userId, scroll) {
    isApiCalling = true;
    let sorting = "createdAt";
    let isAsc = false;

    if (!scroll) {
        $("#article-list").empty();
    }

    $("#articles-division").addClass("active");
    $("#bookmarks-division").removeClass("active");

    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/profile/articles/${userId}?sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}`,
        data : {},
        success : function (response) {
            makeArticles(response);
            showUserLikes(userId)
        },
        error: function (response) {
            processError(response);
        }
    })
}

/* 모든 좋아요 정보 조회 */
function showUserLikes(userId) {
    $.ajax({
        type: 'GET',
        url: `${WEB_SERVER_DOMAIN}/profile/likes/${userId}`,
        success: function (response) {
            makeLikes(response);
        },
        error: function (response) {
            processError(response)
        }
    })
}

// 자신이 저장한 글 보기
function showUserBookmarks(userId) {
    currentPage = 0;
    $("#article-list").empty();
    $("#articles-division").removeClass("active");
    $("#bookmarks-division").addClass("active");

    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/profile/bookmarks/${userId}`,
        data : {},
        success : function (response) {
            makeArticles(response);
        }
    })
}