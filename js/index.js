const MAX_IMAGE_UPLOAD = 10;

let articleStatus = "-list";
let hashtagNameList = [];
let imageFileDict = {};
let imageFileDictKey = 0;

$(document).ready(function () {
    // checkLoginStatus();
})

// localStorage 에 token, username, userId 하나라도 없으면 로그인 페이지로 이동
// function checkLoginStatus() {
//     if (!localStorage.getItem("token") || !localStorage.getItem("username") || !localStorage.getItem("userId")) {
//         location.href = 'login.html'
//     }
// }

function registerEventListener() {
    // 해시태그 입력 리스너
    $("#hashtag-input").keydown(function (e) {
        // 엔터키 입력 체크
        if (e.keyCode == 13) {
            let hashtag = $('#hashtag-input').val();
            if (hashtag == '' || hashtag == '#') {
                return;
            }

            if (!hashtag.charAt(0) != '#') {
                hashtag = '#' + hashtag;
            }

            if (hashtagNameList.includes(hashtag)) {
                alert("이미 입력한 해시태그입니다.");
                $('#hashtag-input').val('');
                return;
            }

            hashtagNameList.push(hashtag);

            let tmpSpan = `<span class="hashtag" 
                                 style="background-color: ${createRandomColor()}" 
                                 onclick="removeHashtag(this, '${hashtag}')">${hashtag}</span>`;
            $('#hashtag-list').append(tmpSpan);

            $('#hashtag-input').val('');
        }
    });

    // 이미지 파일 입력 리스너
    $('#article-images').on('change', function (e) {
        let files = e.target.files;
        let filesArr = Array.prototype.slice.call(files);

        // 업로드 될 파일 총 개수 검사
        let totalFileCnt = Object.keys(imageFileDict).length + filesArr.length
        if (totalFileCnt > MAX_IMAGE_UPLOAD) {
            alert("이미지는 최대 " + MAX_IMAGE_UPLOAD + "개까지 업로드 가능합니다.");
            return;
        }

        filesArr.forEach(function (file) {
            if (!file.type.match("image.*")) {
                alert("이미지 파일만 업로드 가능합니다.");
                return;
            }

            // FIXME: <div> slider
            let reader = new FileReader();
            reader.onload = function (e) {
                imageFileDict[imageFileDictKey] = file;

                let tmpHtml = `<div class="article-image-container" id="image-${imageFileDictKey}">
                                <img src="${e.target.result}" data-file=${file.name} 
                                         class="article-image"/>
                                <div class="article-image-container-middle" onclick="removeImage(${imageFileDictKey++})">
                                    <div class="text">삭제</div>
                                </div>
                           </div>`
                $('#image-list').append(tmpHtml);
            };
            reader.readAsDataURL(file);
        });
    });
}

function modalEventListener() {
    // 모달 꺼졌을 때 상태 확인 리스너
    $('#article-modal').on('hide.bs.modal', function (e) {
        articleStatus = "-list";
        window.location.reload();
    })

    $('#article-modal').on('show.bs.modal', function (e) {
        articleStatus = "-modal";
    })
}

function articleModalToggle(action) {
    switch (action) {
        // 게시글 추가
        case "add":
            $('#article-text-div').hide();
            $('#article-like-count').hide();
            $('#add-article-btn').show();
            $('#article-image-form').show();
            $('#article-location-input-div').show();
            $('#article-hashtag-input-div').show();
            $('#article-textarea').show();
            $('#user-gps-setting').show();
            $('#article-location-list-div').show();
            $('#pagination').show();


            // 이전에 입력되었던 내용 삭제
            hashtagNameList = [];
            imageFileDict = {};
            imageFileDictKey = 0;
            $('#article-images').val('');

            $('#article-username').text(localStorage.getItem("username"));
            // TODO: 사용자 프로필 이미지 사진 설정 (#user-profile-img)
            break;
        // 게시글 상세보기
        case "get":
            $('#add-article-btn').hide();
            $('#article-textarea').hide();
            $('#article-image-form').hide();
            $('#article-location-input-div').hide();
            $('#article-hashtag-input-div').hide();
            $('#user-gps-setting').hide();
            $('#article-location-list-div').hide();
            $('#pagination').hide();
            $('#article-text-div').show();
            $('#article-like-count').show();

            break;
    }
    $('#article-modal').modal('show');
    $('.modal-dynamic-contents').empty();
}

function createRandomColor() {
    return "hsl(" + 360 * Math.random() + ',' +
        (25 + 70 * Math.random()) + '%,' +
        (85 + 10 * Math.random()) + '%)'
}

function removeHashtag(span, rmHashtag) {
    for (let i = 0; i < hashtagNameList.length; i++) {
        if (hashtagNameList[i] == rmHashtag) {
            hashtagNameList.splice(i, 1);
            break;
        }
    }
    span.remove();
}

function removeImage(key) {
    delete imageFileDict[key];
    $(`#image-${key}`).remove();
}

function addArticle() {
    let formData = new FormData();
    let locationJsonString = JSON.stringify(gLocationInfo)
    formData.append("text", $('#article-textarea').val());
    formData.append("location", locationJsonString);
    formData.append("hashtagNameList", hashtagNameList);

    Object.keys(imageFileDict).forEach(function (key) {
        formData.append("imageFileList", imageFileDict[key]);
    });

    $.ajax({
        type: 'POST',
        url: `${WEB_SERVER_DOMAIN}/articles`,
        enctype: 'multipart/form-data',
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function (response) {
            // TODO: 서버로부터 결과값 받기
            alert("게시물이 성공적으로 등록됐습니다.");

            $('#article-modal').modal('hide');
            showArticles();
            showLikes()
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

/* 모든 게시물 조회 */
function showArticles() {
    $.ajax({
        type: 'GET',
        url: `${WEB_SERVER_DOMAIN}/articles`,
        success: function (response) {
            makeArticles(response);
            deleteSelectLocation();
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function makeArticles(articles) {
    $('#article-list').empty();
    articles.forEach(function (article) {
        let tmpHtml = ` <div class="col-3">
                            <div class="card" style="display: inline-block;">
                                <img onclick="getArticle(${article.id})" class="card-img-top" src="${article.imageList[0].url}" alt="Card image cap" width="100px">
                                <div id="card-body-${article.id}" class="card-body">
                                    <span id="card-like-${article.id}"></span>
                                    <p class="card-title">사용자 프로필 이미지 / 사용자 이름 /댓글 수</p>
                                    <p class="card-text"><small class="text-muted">Last updated 3 mins ago</small></p>
                                </div>
                            </div>
                        </div>`;
        $('#article-list').append(tmpHtml);
    })
}

/* 모든 좋아요 정보 조회 */
function showLikes() {
    $.ajax({
        type: 'GET',
        url: (localStorage.getItem('token')) ? `${WEB_SERVER_DOMAIN}/likes` : `${WEB_SERVER_DOMAIN}/likes/guest`,
        success: function (response) {
            makeLikes(response);
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function makeLikes(likes) {
    likes.forEach(function (likeInfo) {
        let tempHtml = ``
        if (likeInfo.like) {
            tempHtml = `<span id="like-icon${articleStatus}-${likeInfo.article.id}" onclick="toggleLike(${likeInfo.article.id})"><i class="fas fa-heart" style="color: red"></i> ${num2str(likeInfo.likeCount)}</span>`
        } else {
            tempHtml = `<span id="like-icon${articleStatus}-${likeInfo.article.id}" onclick="toggleLike(${likeInfo.article.id})"><i class="far fa-heart" style="color: red"></i> ${num2str(likeInfo.likeCount)}</span>`
        }
        $(`#card-like-${likeInfo.article.id}`).append(tempHtml);
    })
}


function toggleLike(articleId) {
    if (localStorage.getItem('token')) {
        if ($(`#like-icon${articleStatus}-${articleId}`).find("i").hasClass("far")) {
            $(`#like-icon${articleStatus}-${articleId}`).find("i").addClass("fas");
            $(`#like-icon${articleStatus}-${articleId}`).find("i").removeClass("far");
            addLike(articleId)
        } else {
            $(`#like-icon${articleStatus}-${articleId}`).find("i").addClass("far");
            $(`#like-icon${articleStatus}-${articleId}`).find("i").removeClass("fas");
            deleteLike(articleId)
        }
    } else {
        return alert("로그인 후 이용해주세요.");
    }
}

function addLike(articleId) {
    $.ajax({
        type: "PUT",
        url: `${WEB_SERVER_DOMAIN}/articles/like?articleId=${articleId}`,
        success: function (response) {
            if (articleStatus == "-list") {
                showArticles()
                window.location.reload();
            } else if (articleStatus == "-modal") {
                getArticle(articleId);
            }
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function deleteLike(articleId) {
    $.ajax({
        type: "PUT",
        url: `${WEB_SERVER_DOMAIN}/articles/unlike?articleId=${articleId}`,
        success: function (response) {
            if (articleStatus == "-list") {
                showArticles()
                window.location.reload();
            } else if (articleStatus == "-modal") {
                getArticle(articleId);
            }
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

/* 특정 게시물 조회: 상세보기 */
function getArticle(id) {
    $.ajax({
        type: 'GET',
        url: `${WEB_SERVER_DOMAIN}/articles/${id}`,
        success: function (response) {
            console.log(response)
            makeArticleContents(response);
            getLike(id)
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function makeArticleContents(article) {
    articleModalToggle("get");

    $('#article-username').text(article.user.username);
    $('#article-text-div').text(article.text);

    <!-- 위치 정보 표시 -->
    $('#article-location-div').empty();
    let tmpHtml = ``
    if (article.location.placeName == "집") {
        tmpHtml = `<a>${article.location.placeName}</a>`
    } else {
        tmpHtml = `<a target='_blank' href="https://map.kakao.com/link/map/${article.location.placeName},
                ${article.location.ycoordinate},${article.location.xcoordinate}">${article.location.placeName}</a>`
    }
    $('#article-location-div').append(tmpHtml);

    $('#image-list').empty();
    article.imageList.forEach(function (image) {
        let tmpHtml = `<div class="article-image-container" id="image-${image.id}">
                            <img src="${image.url}" class="article-image"/>
                       </div>`
        $('#image-list').append(tmpHtml);
    })

    $('#hashtag-list').empty();
    article.hashtagList.forEach(function (hashtag) {
        let tmpSpan = `<span class="hashtag" style="background-color: ${createRandomColor()}">${hashtag.tag}</span>`;
        $('#hashtag-list').append(tmpSpan)
    });
}

/* 특정 게시물 좋아요 조회: 상세보기(좋아요) */
function getLike(id) {
    $.ajax({
        type: 'GET',
        url: (localStorage.getItem('token')) ? `${WEB_SERVER_DOMAIN}/likes/${id}` : `${WEB_SERVER_DOMAIN}/likes/guest/${id}`,
        success: function (response) {
            console.log(response)
            makeArticleContentsByLike(response);
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function makeArticleContentsByLike(likeInfo) {

    <!-- 좋아요 표시 -->
    $('#article-like-count').empty();
    if (likeInfo.like) {
        let tempHtml = `<span id="like-icon${articleStatus}-${likeInfo.article.id}" onclick="toggleLike(${likeInfo.article.id})"><i class="fas fa-heart" style="color: red"></i> 좋아요 : ${num2str(likeInfo.likeCount)}</span>`
        $('#article-like-count').append(tempHtml);
    } else {
        let tempHtml = `<span id="like-icon${articleStatus}-${likeInfo.article.id}" onclick="toggleLike(${likeInfo.article.id})"><i class="far fa-heart" style="color: red"></i> 좋아요 : ${num2str(likeInfo.likeCount)}</span>`
        $('#article-like-count').append(tempHtml);
    }
}


// 좋아요 수 편집 (K로 나타내기)
function num2str(likesCount) {
    if (likesCount > 10000) {
        return parseInt(likesCount / 1000) + "k"
    }
    if (likesCount > 500) {
        return parseInt(likesCount / 100) / 10 + "k"
    }
    if (likesCount == 0) {
        return ""
    }
    return likesCount
}

// 오른쪽 상단 프로필 사진&드롭다운 동적 생성
function showNavbarProfileImage(userId) {
    $.ajax({
        type: "GET",
        url: `${WEB_SERVER_DOMAIN}/profile/navbar-image/${userId}`,
        data: {},
        success: function (response) {
            let temphtml = `<div class="nav-item nav-link" >
                                <img id="nav-user-profile-image" class="for-cursor" src="" alt="profile image" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                  <div class="dropdown-menu">
                                    <a class="dropdown-item" href="profile.html?userId=${userId}">프로필</a>
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item for-cursor" onclick="logout()">로그아웃</a>
                                  </div>
                            </div>`
            $('#nav-user-profile-button').append(temphtml)

            if (response) {
                $("#nav-user-profile-image").attr("src", response);
            } else {
                $("#nav-user-profile-image").attr("src", "/images/profile_placeholder.png");
            }
        }
    })
}

// 로그아웃 (로그인 페이지로 이동)
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    location.href = 'login.html';
}