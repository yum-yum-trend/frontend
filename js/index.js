const MAX_IMAGE_UPLOAD = 10;

let articleStatus = "-list";
let tagNames = [];
let imageFileDict = {};
let imageFileDictKey = 0;
let totalImageFileCnt = 0;
let rmImageIds = [];
let currentPage = 0;
let isApiCalling = false;
let lastPage = false;
let showSearch = "";
let showLocation = "";
let showCategory = "";
let showTagName = "";

let gArticle;


<!-- set JWT token in http request header -->
$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    if(localStorage.getItem('access_token')) {
        jqXHR.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('access_token'));
    }
});


// 오른쪽 상단 프로필 사진&드롭다운 동적 생성
function showNavbarProfileImage(userId) {
    if (userId == null) {
        let tempHtml = `<button type="button" class="btn btn-outline-primary" onClick="location.href='login.html'">로그인</button>`
        $('#nav-user-profile-button').append(tempHtml);

        return;
    }

    $.ajax({
        type: "GET",
        url: `${WEB_SERVER_DOMAIN}/profile/navbar-image/${userId}`,
        data: {},
        success: function (response) {
            let tempHtml = `<div class="nav-item nav-link" >
                                <img id="nav-user-profile-image" class="for-cursor" src="" alt="profile image" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                  <div class="dropdown-menu">
                                    <a class="dropdown-item" href="profile.html?userId=${userId}">프로필</a>
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item for-cursor" onclick="logout()">로그아웃</a>
                                  </div>
                            </div>`
            $('#nav-user-profile-button').append(tempHtml)

            if (response) {
                $("#nav-user-profile-image").attr("src", response);
            } else {
                $("#nav-user-profile-image").attr("src", "/images/profile_placeholder.png");
            }
        },
        error: function (response) {
            // 토큰 오류 (JwtAuthenticationFilter)
            if (response.status === 401) {
                let tempHtml = `<button type="button" class="btn btn-outline-primary" onClick="location.href='login.html'">로그인</button>`
                $('#nav-user-profile-button').append(tempHtml)
                console.log(response)
                console.log(response.responseJSON.message);
            }
            // 애플리케이션 오류 (ApiExceptionHandler)
            else {
                processError(response);
            }
        }
    })
}

// 로그아웃 (로그인 페이지로 이동)
function logout() {
    let data = {username: localStorage.getItem("username")};

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");

    $.ajax({
       type: "POST",
       url: `${WEB_SERVER_DOMAIN}/logout`,
       contentType: "application/json",
       data: JSON.stringify(data),
       success: function (response) {
           location.reload();
       }
    });
}

/* 사용자 구별 */
function isMe(userId) {
    return (localStorage.getItem("userId") == userId);
}

function loadingPageToggle(action, msg) {
    switch (action) {
        case "show":
            $('#modal-load').show();
            $('#modal-load-msg-div').append(`<div>${msg}</div>`);
            break;
        case "hide":
            $('#modal-load-msg-div').empty();
            $('#modal-load').hide();
            break;
    }
}

/* 게시물 추가/보기/수정 모달 내용 토글 */
function articleModalToggle(action) {
    switch (action) {
        // 게시글 추가
        case "add":
            if(localStorage.getItem("access_token") == null) {
                alert("로그인 후 이용해주세요.");
                return;
            }

            $('#article-text-div').hide();
            $('#article-update-btn').hide();
            $('#article-delete-btn').hide();
            $('#article-add-btn').show();
            $('#article-like-count').hide();
            $('#article-comment-input-div').hide();
            $('#article-image-form').show();
            $('#article-location-input-div').show();
            $('#article-tag-input-div').show();
            $('#article-textarea').show();
            $('#user-gps-setting').show();
            $('#article-location-list-div').show();
            $('#pagination').show();
            // 위치정보 검색 결과 영역 내용 삭제
            $('#article-location-div').empty();
            $('#pagination').empty();
            $('#article-location-list-div').empty();

            $('#article-username').text(localStorage.getItem("username"));
            $('#article-user-profile-img').attr('src', $('#nav-user-profile-image').attr('src'));

            $('#article-modal').modal({backdrop: false, keyboard: false, show: true});
            break;
        // 게시글 상세보기
        case "get":
            $('#article-add-btn').hide();
            $('#article-update-btn').hide();
            $('#article-delete-btn').hide();
            $('#article-textarea').hide();
            $('#article-image-form').hide();
            $('#article-location-input-div').hide();
            $('#article-tag-input-div').hide();
            $('#user-gps-setting').hide();
            $('#article-location-list-div').hide();
            $('#pagination').hide();
            $('#article-text-div').show();
            $('#article-like-count').show();
            $('#article-comment-input-div').show();
            $('#article-like-count').show()

            $('#article-modal').modal({backdrop: false, keyboard: false, show: true});
            break;
        // 게시글 업데이트
        case "update":
            $('#article-add-btn').hide();
            $('#article-delete-btn').hide();
            $('#article-text-div').hide();
            $('#article-comment-input-div').hide();
            $('#article-like-count').hide();
            $('#article-textarea').show();
            $('#article-image-form').show();
            $('#article-location-input-div').show();
            $('#article-tag-input-div').show();
            $('#user-gps-setting').show();
            $('#article-location-list-div').show();
            $('#pagination').show();

            $('.modal-dynamic-contents').empty();
    }
}

function createRandomColor() {
    return "hsl(" + 360 * Math.random() + ',' +
        (25 + 70 * Math.random()) + '%,' +
        (85 + 10 * Math.random()) + '%)'
}

function removeTag(span, rmTag) {
    for (let i = 0; i < tagNames.length; i++) {
        if (tagNames[i] == rmTag) {
            tagNames.splice(i, 1);
            break;
        }
    }
    span.remove();
}

function removeImageElement(key) {
    delete imageFileDict[key];
    $(`#image-${key}`).remove();
    totalImageFileCnt--;
    initArticleImageController();
}

function checkArticleImagesInput() {
    if (totalImageFileCnt == 0) {
        alert("최소 1개 이상의 이미지를 업로드해야합니다.");
        return false;
    }

    return true;
}

function addArticle() {
    if (!checkArticleImagesInput()) return;

    loadingPageToggle("show", "게시물을 등록 중입니다.");

    let formData = new FormData();
    let locationJsonString = JSON.stringify(gLocationInfo)
    formData.append("text", $('#article-textarea').val());
    formData.append("location", locationJsonString);
    formData.append("tagNames", tagNames);

    Object.keys(imageFileDict).forEach(function (key) {
        formData.append("imageFiles", imageFileDict[key]);
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
            alert("게시물이 성공적으로 등록됐습니다.");

            loadingPageToggle("hide");
            $('#article-modal').modal('hide');

            $('#article-list').empty();
            showArticles();
        },
        error: function (response) {
            processError(response);
        }
    })
}

function reloadChart() {
    showLocation = "";
    showCategory = "";
    showTagName = "";
    currentPage = 0;
    $('#article-list').empty();
    locationChart();
    tagChart();
    showArticles();
}

function searchArticle() {
    showLocation = "";
    showCategory = "";
    $(".trend").hide();
    $("#profile-content").hide();
    currentPage = 0;
    $('#article-list').empty();
    showArticles()
}

function TrendLocationArticle(location) {
    showLocation = location;
    showCategory = "";
    showTagName = "";
    currentPage = 0;
    $('#article-list').empty();
    showArticles();
}

function TrendCategoryArticle(category) {
    showCategory = category;
    showTagName = "";
    currentPage = 0;
    $('#article-list').empty();
    showArticles()
}

function TrendTagArticle(tag) {
    showCategory = "";
    showTagName = tag;
    currentPage = 0;
    $('#article-list').empty();
    showArticles()
}

/* 모든 게시물 조회 */
function showArticles() {
    console.log("showSearch"+showSearch)
    console.log("showLocation"+showLocation)
    let urlSource = "";

    console.log("current page = " + currentPage);

    isApiCalling = true;
    let sorting = "createdAt";
    let isAsc = false;
    let tag = $("#search-tag").val();

    if (showLocation) {
        if (showCategory) {
            urlSource = `${WEB_SERVER_DOMAIN}/articles?searchTag=${(tag === undefined) ? '' : tag}&sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}&location=${showLocation}&category=${showCategory}&tagName=`
        } else if (showTagName) {
            urlSource = `${WEB_SERVER_DOMAIN}/articles?searchTag=${(tag === undefined) ? '' : tag}&sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}&location=${showLocation}&category=&tagName=${showTagName}`
        } else {
            urlSource = `${WEB_SERVER_DOMAIN}/articles?searchTag=${(tag === undefined) ? '' : tag}&sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}&location=${showLocation}&category=&tagName=`
        }
    } else {
        if (showCategory) {
            urlSource = `${WEB_SERVER_DOMAIN}/articles?searchTag=${(tag === undefined) ? '' : tag}&sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}&location=&category=${showCategory}&tagName=`
        } else if (showTagName) {
            urlSource = `${WEB_SERVER_DOMAIN}/articles?searchTag=${(tag === undefined) ? '' : tag}&sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}&location=&category=&tagName=${showTagName}`
        } else {
            urlSource = `${WEB_SERVER_DOMAIN}/articles?searchTag=${(tag === undefined) ? '' : tag}&sortBy=${sorting}&isAsc=${isAsc}&currentPage=${currentPage}&location=&category=&tagName=`
        }

    }

    $.ajax({
        type: 'GET',
        url: urlSource,
        success: function (response) {
            console.log(response)
            makeArticles(response)
            showLikes()
        },
        error: function (response) {
            processError(response);
        }
    })
}

function makeArticles(articles) {
    lastPage = articles.last;
    // console.log(articles.content[0]['comments'].length) // articles 비어있으면 오류 발생
    articles.content.forEach(function (article) {
        let tmpHtml = ` <div id="article-id-${article.id}" class="col-3">
                            <div class="card" style="display: inline-block;">
                                <img onclick="getArticle(${article.id})" class="card-img-top" src="${article.images[0].url}" alt="Card image cap" width="100px">
                                <div id="card-body-${article.id}" class="card-body">
                                    <div class="card-body-content">
                                        <div class="card-body-left">
                                            <img class="article-writter-profile-image for-cursor" src="${(article.user.userProfileImageUrl) == null ? "/images/profile_placeholder.png" : article.user.userProfileImageUrl}" alt="" onclick="location.href='profile.html?userId=${article.user.id}'">
                                            <p class="card-title">${article.user.username}<br>💬 <span id="comment-counter-article-${article.id}">${article['comments'].length}</span></p>
                                        </div>
                                        <div class="card-body-right">
                                            <span id="card-like-${article.id}"></span>
                                            <p class="card-text"><small class="text-muted">${articleTimeCounter(article.createdAt)}</small></p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>`;
        $('#article-list').append(tmpHtml);
    })
    isApiCalling = false;
    if(articles.totalPages != articles.number + 1) {
        currentPage += 1
    }
}

// 시간 표시
function articleTimeCounter(createdAt) {
    let now = new Date();
    let ago = now.getTime() - Date.parse(createdAt)
    ago = Math.ceil(ago / 1000 / 60)
    ago -= 60*9

    if (ago < 60) {
        return `${ago} 분 전`
    } else if ((ago / 60) < 24) {
        return `${Math.floor(ago / 60)} 시간 전`
    } else if ((ago / 60 / 24) < 31) {
        return `${Math.floor(ago / 60 / 24)} 일 전`
    } else if ((ago / 60 / 24 / 30) > 0) {
        createdAt = createdAt.split("T")[0]
        return createdAt
    }
}

/* 모든 좋아요 정보 조회 */
function showLikes() {
    $.ajax({
        type: 'GET',
        url: (localStorage.getItem('access_token')) ? `${WEB_SERVER_DOMAIN}/likes` : `${WEB_SERVER_DOMAIN}/likes/guest`,
        success: function (response) {
            makeLikes(response);
        },
        error: function (response) {
            processError(response);
        }
    })
}

function makeLikes(likes) {
    likes.forEach(function (likeInfo) {
        $(`#card-like-${likeInfo.articleId}`).empty();
        let tempHtml = ``
        if (likeInfo.like) {
            tempHtml = `<span id="like-icon-list-${likeInfo.articleId}" onclick="toggleLike(${likeInfo.articleId})"><i class="fas fa-heart" style="color: red"></i> ${num2str(likeInfo.likeCount)}</span>`
        } else {
            tempHtml = `<span id="like-icon-list-${likeInfo.articleId}" onclick="toggleLike(${likeInfo.articleId})"><i class="far fa-heart" style="color: red"></i> ${num2str(likeInfo.likeCount)}</span>`
        }
        $(`#card-like-${likeInfo.articleId}`).append(tempHtml);
    })
}


function toggleLike(articleId) {
    if (localStorage.getItem('access_token')) {
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
                showLikes()
            } else if (articleStatus == "-modal") {
                getLike(articleId);
                showLikes();
            }
        },
        error: function (response) {
            processError(response);
        }
    })
}

function deleteLike(articleId) {
    $.ajax({
        type: "PUT",
        url: `${WEB_SERVER_DOMAIN}/articles/unlike?articleId=${articleId}`,
        success: function (response) {
            if (articleStatus == "-list") {
                showLikes()
            } else if (articleStatus == "-modal") {
                getLike(articleId);
                showLikes();
            }
        },
        error: function (response) {
            processError(response);
        }
    })
}

/* 특정 게시물 조회: 상세보기 */
function getArticle(id) {
    $.ajax({
        type: 'GET',
        url: `${WEB_SERVER_DOMAIN}/articles/${id}`,
        success: function (response) {
            gArticle = response;
            articleModalToggle("get");
            makeArticleContents("get");
            makeArticleCommentButton(id)
            getLike(id);
            showArticleComments(id)
        },
        error: function (response) {
            processError(response);
        }
    })
}

function replaceTextNewLine(text) {
    return text.replace(/(\r\n|\r|\n)/g,'<br/>');
}

/* 모달 출력 내용 (게시물 조회 / 수정) */
function makeArticleContents(action) {
    totalImageFileCnt = gArticle.images.length;
    initArticleImageController();

    $('.modal-dynamic-contents').empty();

    if (gArticle.user.userProfileImageUrl) {
        $("#article-user-profile-img").attr("src", gArticle.user.userProfileImageUrl);
    } else {
        $("#article-user-profile-img").attr("src", "/images/profile_placeholder.png");
    }

    if (action == "get") {
        $('#article-username').text(gArticle.user.username);
        $('#article-text-div').append(`${replaceTextNewLine(gArticle.text)}`);

        <!-- 위치 정보 표시 -->
        let tmpHtml = ``
        if (gArticle.location.placeName == "집") {
            tmpHtml = `<a>${gArticle.location.placeName}</a>`
        } else {
            tmpHtml = `<a target='_blank' href="https://map.kakao.com/link/map/${gArticle.location.placeName},
                ${gArticle.location.ycoordinate},${gArticle.location.xcoordinate}">${gArticle.location.placeName}</a>`
        }
        $('#article-location-div').append(tmpHtml);

        gArticle.images.forEach(function (image) {
            let tmpHtml = `<div class="article-image-container article-image" id="image-${image.id}">
                            <img src="${image.url}" class=""/>
                           </div>`
            $('#article-image-list').append(tmpHtml);
        })

        gArticle.tags.forEach(function (tag) {
            let tmpSpan = `<span class="tag" style="background-color: ${createRandomColor()}">#${tag.name}</span>`;
            $('#tag-list').append(tmpSpan)
        })

        // 게시물 작성자와 사용자 구별
        if (isMe(gArticle.user.id)) {
            $('#article-delete-btn').show();
            $('#article-delete-btn').attr("onclick", `deleteArticle(${gArticle.id})`)
            $('#article-update-btn').show();
            $('#article-update-btn').html('수정하기');
            $('#article-update-btn').attr("onclick", "$('#article-delete-btn').hide(); articleModalToggle('update'); makeArticleContents('update')");
        }
    } else if (action == "update") {
        gArticle.tags.forEach(function (tag) {
            tagNames.push(tag.name);
        })

        $('#article-username').text(gArticle.user.username);
        $('#article-textarea').val(gArticle.text);

        <!-- 위치 정보 표시 -->
        let tmpHtml = ``
        if (gArticle.location.placeName == "집") {
            gLocationInfo = {}; // 다시 입력받아야 하므로 값을 초기화 시켜주기
            tmpHtml = `<a>${gArticle.location.placeName}</a>`
        } else {
            gLocationInfo = {
                "roadAddressName": gArticle.location.roadAddressName,
                "placeName": gArticle.location.placeName,
                "xCoordinate": gArticle.location.xcoordinate,
                "yCoordinate": gArticle.location.ycoordinate,
                "categoryName": gArticle.location.categoryName
            }

            tmpHtml = `<span id="article-location-span" onClick="deleteSelectLocation()">
                            <li>${gLocationInfo["placeName"]}<i className="fas fa-times"></i>
                            </li>
                       </span>`
        }
        $('#article-location-div').append(tmpHtml);

        totalImageFileCnt = gArticle.images.length;
        gArticle.images.forEach(function (image) {
            let tmpHtml = `<div class="article-image-container article-image" id="image-${image.id}" onclick="removeImage(${image.id}, this)">
                                <img src="${image.url}" class=""/>
                                 <div class="article-image-container-middle" >
                                    <div class="text">삭제</div>
                                </div>
                           </div>`
            $('#article-image-list').append(tmpHtml);
        })

        gArticle.tags.forEach(function (tag) {
            let tmpSpan = `<span class="tag" style="background-color: ${createRandomColor()}"  
                                 onclick="removeTag(this, '${tag.name}')">#${tag.name}</span>`;
            $('#tag-list').append(tmpSpan)
        })

        $('#article-update-btn').html('게시하기');
        $('#article-update-btn').attr("onclick", `updateArticle(${gArticle.id})`);
    }
}


/* 이미지 삭제 (업로드된 이미지들 중) */
function removeImage(id, img) {
    rmImageIds.push(id);

    totalImageFileCnt--;
    img.remove();
    initArticleImageController();
}


/* 게시물 수정 */
function updateArticle(id) {
    if (!checkArticleImagesInput()) return;

    loadingPageToggle("show", "게시물을 수정 중입니다.");

    let formData = new FormData();
    let locationJsonString = JSON.stringify(gLocationInfo)
    formData.append("text", $('#article-textarea').val());
    formData.append("location", locationJsonString);
    formData.append("tagNames", tagNames);

    Object.keys(imageFileDict).forEach(function (key) {
        formData.append("imageFiles", imageFileDict[key]);
    });

    rmImageIds.forEach(function (id) {
        formData.append("rmImageIds", id);
    })


    $.ajax({
        type: 'POST',
        url: `${WEB_SERVER_DOMAIN}/articles/${id}`,
        enctype: 'multipart/form-data',
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function (response) {
            alert("게시물이 성공적으로 수정됐습니다.");

            loadingPageToggle("hide");
            $('#article-modal').modal('hide');

            $('#article-list').empty();
            showArticles();
        },
        error: function (response) {
            processError(response);
        }
    })
}


/* 게시물 삭제 */
function deleteArticle(id) {
    loadingPageToggle("show", "게시물을 삭제 중입니다.");

    $.ajax({
        type: 'DELETE',
        url: `${WEB_SERVER_DOMAIN}/articles/${id}`,
        enctype: 'multipart/form-data',
        success: function (response) {
            alert("게시물을 성공적으로 삭제했습니다.");

            loadingPageToggle("hide");
            $('#article-modal').modal('hide');
            $(`#article-id-${id}`).remove();
        },
        error: function (response) {
            processError(response);
        }
    })
}

/* 특정 게시물 좋아요 조회: 상세보기(좋아요) */
function getLike(id) {
    $.ajax({
        type: 'GET',
        url: (localStorage.getItem('access_token')) ? `${WEB_SERVER_DOMAIN}/likes/${id}` : `${WEB_SERVER_DOMAIN}/likes/guest/${id}`,
        success: function (response) {
            makeArticleByLike(response);
        },
        error: function (response) {
            processError(response);
        }
    })
}

function makeArticleByLike(likeInfo) {
    <!-- 좋아요 표시 -->
    $('#article-like-count').empty();
    if (likeInfo.like) {
        let tempHtml = `<span id="like-icon-modal-${likeInfo.articleId}" onclick="toggleLike(${likeInfo.articleId})"><i class="fas fa-heart" style="color: red"></i> 좋아요 : ${num2str(likeInfo.likeCount)}</span>`
        $('#article-like-count').append(tempHtml);
    } else {
        let tempHtml = `<span id="like-icon-modal-${likeInfo.articleId}" onclick="toggleLike(${likeInfo.articleId})"><i class="far fa-heart" style="color: red"></i> 좋아요 : ${num2str(likeInfo.likeCount)}</span>`
        $('#article-like-count').append(tempHtml);
    }
}

function makeArticleCommentButton(articleId) {
    // 댓글 버튼
    let tempHtml = `<button class="btn btn-outline-secondary" id="article-comment-post-button" type="button" name="${articleId}" onclick="postComment(${articleId})">게시하기</button>`
    $('#article-comment-input-button-div').append(tempHtml);
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

// 게시물 상세보기 - 댓글
function showArticleComments(articleId) {
    $.ajax({
        type: "GET",
        url: `${WEB_SERVER_DOMAIN}/comment/${articleId}`,
        success: function (response) {
            for (let i = 0; i < response.length; i++) {
                let imgSrc = response[i].userProfileImageUrl ? response[i].userProfileImageUrl : "/images/profile_placeholder.png";
                let tempHtml = `<div class="comment-box modal-dynamic-contents" id="comment-box-${response[i].commentId}">
                                    <div class="comment">
                                        <img class="comment-user-profile-image for-cursor" src="${imgSrc}" onclick="location.href='profile.html?userId=${response[i].userId}'">
                                        <a class="comment-username">${response[i].username}</a>
                                        <a class="comment-text">${response[i].commentText}</a>
                                    </div>`

                if (gUserId === `${response[i].userId}`) {
                    tempHtml += `<a onclick="deleteComment(${response[i].commentId}, ${articleId})" aria-hidden="true" class="for-cursor x">&times;</a>`
                }
                tempHtml += `</div>`
                $('#article-comment-div').append(tempHtml)
            }
        },
        error: function (response) {
            processError(response);
        }
    })
}

// 댓글 입력
function postComment(articleId) {
    let token = localStorage.getItem('access_token');
    let commentText = $('#article-comment-input-box').val();

    if (!token) {
        return alert("로그인이 필요합니다.")
    } else if (!commentText) {
        alert("댓글 내용을 입력해주세요.")
    } else {
        $.ajax({
            type: "POST",
            url: `${WEB_SERVER_DOMAIN}/comment/${articleId}`,
            contentType: "application/json",
            data: JSON.stringify({
                commentText: commentText
            }),
            success: function () {
                $('#article-comment-div').empty();
                showArticleComments(articleId);
                $('#article-comment-input-box').val('');
              
                let counter = $(`#comment-counter-article-${articleId}`).text();
                $(`#comment-counter-article-${articleId}`).text(Number(counter)+1);
                console.log("posting comment success")
            },
            error: function (response) {
                processError(response);
            }
        })
    }
}

// 댓글 삭제
function deleteComment(commentId, articleId) {
    if (confirm("댓글을 삭제하시겠습니까?")) {
        $.ajax({
            type: "DELETE",
            url: `${WEB_SERVER_DOMAIN}/comment/${commentId}`,
            success: function () {
                $(`#comment-box-${commentId}`).remove();
                let counter = $(`#comment-counter-article-${articleId}`).text();
                $(`#comment-counter-article-${articleId}`).text(Number(counter)-1);
            },
            error: function (response) {
                processError(response);
            }
        })
    }

}
