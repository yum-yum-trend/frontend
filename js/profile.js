const gUserId = localStorage.getItem('userId')
const gUsername = localStorage.getItem('username')
const gProfileUserId = new RegExp('[\?]' + 'userId' + '=([^#]*)').exec(window.location.href)[1]
const gIsMyPage = (gUserId === gProfileUserId);


$(document).ready(function () {
    $('#header').load("header.html");
    $('#list').load("list.html");
    $('#article-modal').load("article-modal.html");
    $("#article-list").hide();
    $("#comment-list").hide();
    showNavbarProfileImage(gUserId);
    showMyPageSettings()
    showUserProfileInfo(gProfileUserId)
    showUserArticles(gProfileUserId)
})

// 유저에 따른 프로필 이미지 변경 & 설정 버튼 활성화 여부
function showMyPageSettings() {
    if (gIsMyPage) {
        let profilePictureButtonActive = `<img id="user-profile-image" class="for-cursor" title="프로필 사진 추가" src="" alt="profile image">
                                                <input class="form-control" type="file" accept="img/*" id="imageFile" name="imageFile" style="display:none;">`
        let settingButtonActive = `<button type="button" id="setting-button" class="btn btn-outline-secondary" data-toggle="modal" data-target="#profile-change-modal">설정</button>`
        $('#profile-pic').append(profilePictureButtonActive)
        $('#setting-button-div').append(settingButtonActive)
    } else {
        let profilePictureButtonInactive = `<img id="user-profile-image" src="" alt="profile image">`
        $('#profile-pic').append(profilePictureButtonInactive)
    }
}


// 프로필 이미지 클릭 시 업로드 창 띄우기
$(function() {
    $('#user-profile-image').click(function () {
        $("input[name='imageFile']").click();
    })

    $('#imageFile').on('change', function (e) {
        e.preventDefault();
        var newProfileImage = e.target.files[0];

        updateUserProfileImage(newProfileImage);
    })
})


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
            alert(`에러가 발생했습니다.\n변경 사항은 저장되지 않았습니다.\nError Code: ${request.status}`)
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
            console.log(response)
            $('#profile-username').text(response.username);
            $('#profile-email').text(response.email);

            if (response.kakaoId){
                $('#password-to-change-form').hide();
                $('#password-to-change-check-form').hide();
                $('#present-password-form').hide();
            }

            if (response.userProfileIntro) {
                $('#profile-introduction').text(response.userProfileIntro);
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
            type: "GET",
            url: `${WEB_SERVER_DOMAIN}/profile/image-reset/${userId}`,
            data: {},
            success: function () {
                alert("프로필 사진이 초기화 되었습니다.");
                $('#profile-change-modal').modal('hide');
                location.reload();
            }
        })
    }
}

// 유저 정보 변경 (비밀번호, 상태 메시지)
function updateUserProfileInfo(userId) {
    let presentPassword = $("#present-password").val();
    let newPassword = $("#password-to-change").val();
    let newPasswordCheck = $("#password-to-change-check").val();
    let newProfileText = $("#profile-text-to-change").val();

    if (presentPassword === "" && (newPassword !== "" || newPasswordCheck !== "")) {
        return alert("사용중인 비밀번호를 입력해주세요.")
    }

    if (presentPassword !== "" && (newPassword === "" && newPasswordCheck === "")) {
        return alert("변경할 비밀번호를 입력해주세요.")
    }

    if (newPassword !== newPasswordCheck) {
        alert("새 비밀번호가 서로 동일하지 않습니다.")
    } else {
        $.ajax({
            type : "POST",
            url : `${WEB_SERVER_DOMAIN}/profile/update/${userId}`,
            contentType: "application/json",
            data: JSON.stringify({
                nowPassword : presentPassword,
                newPassword : newPassword,
                userProfileIntro : newProfileText
            }),
            success: function () {
                alert("변경되었습니다.")
                $('#profile-change-modal').modal('hide');
                location.reload();
            },
            error: function (request) {
                if (request.status === 401) {
                    alert("현재 사용중인 비밀번호를 정확히 입력해주세요.")
                } else {
                    alert(`에러가 발생했습니다.\n변경 사항은 저장되지 않았습니다.\nError Code: ${request.status}`)
                }
            }
        })
    }
}

// 자신이 작성한 글 보기
function showUserArticles(userId) {
    $("#article-list").empty();
    $("#articles-division").addClass("active");
    $("#comments-division").removeClass("active");
    $("#comment-list").hide();
    $("#article-list").show();

    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/profile/articles/${userId}`,
        data : {},
        success : function (response) {
            makeArticles(response);
        }
    })
}

// 자신이 저장한 글 보기
function showUserBookmarks(userId) {
    $("#article-list").empty();
    $("#articles-division").removeClass("active");
    $("#bookmarks-division").addClass("active");
    $("#comments-division").removeClass("active");
    $("#comment-list").hide();
    $("#article-list").show();

    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/profile/bookmarks/${userId}`,
        data : {},
        success : function (response) {
            makeArticles(response);
        }
    })
}

// 자신이 작성한 코멘트 보기
function showUserComments(userId) {
    $("#comment-list").empty();
    $("#articles-division").removeClass("active");
    $("#bookmarks-division").removeClass("active");
    $("#comments-division").addClass("active");
    $("#article-list").hide();
    $("#comment-list").show();

    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/profile/comments/${userId}`,
        data : {},
        success : function (response) {
            makeComments(response);
        }
    })
}

function makeComments(response) {
    // 댓글 기능 완성 후 작성 예정
}