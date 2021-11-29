const MAX_IMAGE_UPLOAD = 10;

let articleStatus = "-list";
let tagNames = [];
let imageFileDict = {};
let imageFileDictKey = 0;
let totalImageFileCnt = 0;

let gArticle;
const gUserId = localStorage.getItem('userId')

$(document).ready(function () {
    $('#header').load("header.html");
    $('#list').load("list.html");
    $('#modal').load("article-modal.html");

    showNavbarProfileImage(gUserId);
    showArticles();
    showLikes();
});

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

/* 리스너 등록 함수 */
function registerEventListener() {
    console.log("event resgister listener");
    // 해시태그 입력 리스너
    $("#tag-input").keydown(function(e) {
         // 엔터키 입력 체크
        if (e.keyCode == 13) {
            let tag = $('#tag-input').val();
            if(tag == '' || tag == '#') {
                return;
            }

            if(!tag.charAt(0) != '#') {
                tag = '#' + tag;
            }

            if(tagNames.includes(tag)) {
                alert("이미 입력한 해시태그입니다.");
                $('#tag-input').val('');
                return;
            }

            tagNames.push(tag);

            let tmpSpan = `<span class="tag" 
                                 style="background-color: ${createRandomColor()}" 
                                 onclick="removeTag(this, '${tag}')">${tag}</span>`;
            $('#tag-list').append(tmpSpan);

            $('#tag-input').val('');
        }
    });

    // 이미지 파일 입력 리스너
    $('#article-images').on('change', function (e) {
        let files = e.target.files;
        let filesArr = Array.prototype.slice.call(files);

        // 업로드 될 파일 총 개수 검사
        totalImageFileCnt = Object.keys(imageFileDict).length + filesArr.length
        if (totalImageFileCnt > MAX_IMAGE_UPLOAD) {
            alert("이미지는 최대 " + MAX_IMAGE_UPLOAD +"개까지 업로드 가능합니다.");
            totalImageFileCnt -= filesArr.length;

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
                                <div class="article-image-container-middle" onclick="removeImageElement(${imageFileDictKey++})">
                                    <div class="text">삭제</div>
                                </div>
                           </div>`
                $('#image-list').append(tmpHtml);
            };
            reader.readAsDataURL(file);
        });
    });

    // modal hide 리스너
    $('#article-modal').on('hidden.bs.modal', function (e) {
        // 이전에 입력되었던 내용 삭제
        tagNames = [];
        imageFileDict = {};
        imageFileDictKey = 0;
        deleteSelectLocation();
        
        $('#article-images').val('');
        $('#article-textarea').val('');
        $('.modal-dynamic-contents').empty();
      
        articleStatus = "-list";
        window.location.reload();
    })
  
    // modal show 리스너
    $('#article-modal').on('show.bs.modal', function (e) {
        articleStatus = "-modal";
    })
}

/* 게시물 추가/보기/수정 모달 내용 토글 */
function articleModalToggle(action) {
    switch (action) {
        // 게시글 추가
        case "add":
            $('#article-text-div').hide();
            $('#article-update-btn').hide();
            $('#article-delete-btn').hide();
            $('#article-add-btn').show();
            $('#article-like-count').hide();
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
            // TODO: 사용자 프로필 이미지 사진 설정 (#user-profile-img)

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

            $('#article-modal').modal({backdrop: false, keyboard: false, show: true});
            break;
        // 게시글 업데이트
        case "update":
            $('#article-add-btn').hide();
            $('#article-delete-btn').hide();
            $('#article-textarea').show();
            $('#article-image-form').show();
            $('#article-location-input-div').show();
            $('#article-tag-input-div').show();
            $('#user-gps-setting').show();
            $('#article-location-list-div').show();
            $('#pagination').show();
            $('#article-text-div').hide();

            $('.modal-dynamic-contents').empty();
    }
}

function createRandomColor() {
    return "hsl(" + 360 * Math.random() + ',' +
        (25 + 70 * Math.random()) + '%,' +
        (85 + 10 * Math.random()) + '%)'
}

function removeTag(span, rmTag) {
    for(let i = 0; i < tagNames.length; i++) {
        if(tagNames[i] == rmTag) {
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
}

function checkArticleImagesInput() {
    console.log(totalImageFileCnt);
    if(totalImageFileCnt == 0) {
        alert("최소 1개 이상의 이미지를 업로드해야합니다.");
        return false;
    }

    return true;
}

function addArticle() {
    if(!checkArticleImagesInput()) return;

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
                                <img onclick="getArticle(${article.id})" class="card-img-top" src="${article.images[0].url}" alt="Card image cap" width="100px">
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
            gArticle = response;
            articleModalToggle("get");
            makeArticleContents("get");
            getLike(id)
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

/* 모달 출력 내용 (게시물 조회 / 수정) */
function makeArticleContents(action) {
    $('.modal-dynamic-contents').empty();
    if (action == "get") {
        $('#article-username').text(gArticle.user.username);
        $('#article-text-div').text(gArticle.text);

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
            let tmpHtml = `<div class="article-image-container" id="image-${image.id}">
                            <img src="${image.url}" class="article-image"/>
                           </div>`
            $('#image-list').append(tmpHtml);
        })

        gArticle.tags.forEach(function (tag) {
            let tmpSpan = `<span class="tag" style="background-color: ${createRandomColor()}">${tag.name}</span>`;
            $('#tag-list').append(tmpSpan)
        })

        // 게시물 작성자와 사용자 구별
        if(isMe(gArticle.user.id)) {
            $('#article-delete-btn').show();
            $('#article-delete-btn').attr("onclick", `deleteArticle(${gArticle.id})`)
            $('#article-update-btn').show();
            $('#article-update-btn').html('수정하기');
            $('#article-update-btn').attr("onclick", "$('#article-delete-btn').hide(); articleModalToggle('update'); makeArticleContents('update')");
        }
    }
    else if (action == "update") {
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

            console.log(gArticle.location)
            console.log(gLocationInfo)

            tmpHtml = `<span id="article-location-span" onClick="deleteSelectLocation()">
                            <li>${gLocationInfo["placeName"]}<i className="fas fa-times"></i>
                            </li>
                       </span>`
        }
        $('#article-location-div').append(tmpHtml);

        totalImageFileCnt = gArticle.images.length;
        gArticle.images.forEach(function (image) {
            let tmpHtml = `<div class="article-image-container" id="image-${image.id}" onclick="totalImageFileCnt--; deleteImage(${image.id}, this)">
                                <img src="${image.url}" class="article-image"/>
                                 <div class="article-image-container-middle" >
                                    <div class="text">삭제</div>
                                </div>
                           </div>`
            $('#image-list').append(tmpHtml);
        })

        gArticle.tags.forEach(function (tag) {
            let tmpSpan = `<span class="tag" style="background-color: ${createRandomColor()}"  
                                 onclick="removeTag(this, '${tag.name}')">${tag.name}</span>`;
            $('#tag-list').append(tmpSpan)
        })

        $('#article-update-btn').html('게시하기');
        $('#article-update-btn').attr("onclick", `updateArticle(${gArticle.id})`);
    }
}

/* 게시물 수정 */
function updateArticle(id) {
    if(!checkArticleImagesInput()) return;

    loadingPageToggle("show", "게시물을 수정 중입니다.");

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

            showArticles();
        },
        fail: function (err) {
            alert("fail");
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
            $('#article-modal').hide();
        },
        fail: function (err) {
            alert("fail");
        }
    })
}  


/* 이미지 삭제 (게시물 수정) */
function deleteImage(id, img) {
    loadingPageToggle("show", "이미지를 삭제 중입니다.");
    $.ajax({
        type: 'DELETE',
        url: `${WEB_SERVER_DOMAIN}/articles/image/${id}`,
        enctype: 'multipart/form-data',
        success: function (response) {
            alert("업로드된 이미지를 삭제했습니다.");
            loadingPageToggle("hide");
            img.remove();
        },
        fail: function (err) {
            alert("fail");
        }
    })
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