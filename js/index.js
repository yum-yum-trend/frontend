const MAX_IMAGE_UPLOAD = 10;

let tagNames = [];
let imageFileDict = {};
let imageFileDictKey = 0;

let gArticle;

$(document).ready(function () {
    console.log("ready")
    $('#header').load("header.html");
    $('#list').load("list.html");
    $('#modal').load("article-modal.html");

    showArticles();
});

/* 사용자 구별 */
function isMe(userId) {
    return (localStorage.getItem("userId") == userId);
}

/* 리스너 등록 함수 */
function registerEventListener() {
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
        let totalFileCnt = Object.keys(imageFileDict).length + filesArr.length
        if (totalFileCnt > MAX_IMAGE_UPLOAD) {
            alert("이미지는 최대 " + MAX_IMAGE_UPLOAD +"개까지 업로드 가능합니다.");
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

    // 모달 닫힘 리스너
    $('#article-modal').on('hidden.bs.modal', function (e) {
        console.log("modal close");
        // 이전에 입력되었던 내용 삭제
        tagNames = [];
        imageFileDict = {};
        imageFileDictKey = 0;
        deleteSelectLocation();
        
        $('#article-images').val('');
        $('#article-textarea').val('');
        $('.modal-dynamic-contents').empty();
    })
}

/* 게시물 추가/보기/수정 모달 내용 토글 */
function articleModalToggle(action) {
    switch(action) {
        // 게시글 추가
        case "add":
            $('#article-text-div').hide();
            $('#update-article-btn').hide();
            $('#add-article-btn').show();
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

            $('#article-modal').modal('show');
            break;
        // 게시글 상세보기
        case "get":
            $('#add-article-btn').hide();
            $('#update-article-btn').hide();
            $('#article-textarea').hide();
            $('#article-image-form').hide();
            $('#article-location-input-div').hide();
            $('#article-tag-input-div').hide();
            $('#user-gps-setting').hide();
            $('#article-location-list-div').hide();
            $('#pagination').hide();
            $('#article-text-div').show();

            $('#article-modal').modal('show');
            break;
        // 게시글 업데이트
        case "update":
            $('#add-article-btn').hide();
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
}

function addArticle() {
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
            // TODO: 서버로부터 결과값 받기
            alert("게시물이 성공적으로 등록됐습니다.");

            $('#article-modal').modal('hide');
            showArticles();
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
            console.log(response);
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
                            <div class="card" onclick="getArticle(${article.id})" style="display: inline-block;">
                                <img class="card-img-top" src="${article.images[0].url}" alt="Card image cap" width="100px">
                                <div class="card-body">
                                    <p class="card-title">사용자 프로필 이미지 / 사용자 이름 / 좋아요 수 / 댓글 수</p>
                                    <p class="card-text"><small class="text-muted">Last updated 3 mins ago</small></p>
                                </div>
                            </div>
                        </div>
                        `;
        $('#article-list').append(tmpHtml);
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
        },
        fail: function (err) {
            alert("fail");
        }
    })
}


function makeArticleContents(action) {
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
            $('#update-article-btn').show();
            $('#update-article-btn').html('수정하기');
            $('#update-article-btn').attr("onclick", "articleModalToggle('update'); makeArticleContents('update')");
        }
    }
    else if (action == "update") {
        gLocationInfo = gArticle.location;
        gLocationInfo = {
            "roadAddressName": gLocationInfo.roadAddressName,
            "placeName": gLocationInfo.placeName,
            "xCoordinate": gLocationInfo.xCoordinate,
            "yCoordinate": gLocationInfo.yCoordinate,
            "categoryName": gLocationInfo.categoryName
        }

        gArticle.tags.forEach(function (tag) {
            tagNames.push(tag.name);
        })

        console.log("[update] gLocationInfo   = " + gLocationInfo);
        console.log("[update] tagNames = " + tagNames);

        $('#article-username').text(gArticle.user.username);
        $('#article-textarea').val(gArticle.text);

        <!-- 위치 정보 표시 -->
        let tmpHtml = ``
        if (gArticle.location.placeName == "집") {
            gLocationInfo = {}; // 다시 입력받아야 하므로 값을 초기화 시켜주기
            tmpHtml = `<a>${gArticle.location.placeName}</a>`
        } else {
            tmpHtml = `<a target='_blank' href="https://map.kakao.com/link/map/${gArticle.location.placeName},
                ${gArticle.location.ycoordinate},${gArticle.location.xcoordinate}">${gArticle.location.placeName}</a>`
        }
        $('#article-location-div').append(tmpHtml);

        gArticle.images.forEach(function (image) {
            let tmpHtml = `<div class="article-image-container" id="image-${image.id}">
                                <img src="${image.url}" class="article-image"/>
                                 <div class="article-image-container-middle" onclick="deleteImage(${image.id})">
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

        $('#update-article-btn').html('게시하기');
        $('#update-article-btn').attr("onclick", `updateArticle(${gArticle.id})`);
    }
}

/* 게시물 수정하기 */
function updateArticle(id) {
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

            $('#article-modal').modal('hide');
            showArticles();
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function deleteImage(id) {

}