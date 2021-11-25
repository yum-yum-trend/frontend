const MAX_IMAGE_UPLOAD = 10;

let hashtagNameList = [];
let imageFileDict = {};
let imageFileDictKey = 0;

function registerEventListener() {
    // 해시태그 입력 리스너
    $("#hashtag-input").keydown(function(e) {
         // 엔터키 입력 체크
        if (e.keyCode == 13) {
            let hashtag = $('#hashtag-input').val();
            if(hashtag == '' || hashtag == '#') {
                return;
            }

            if(!hashtag.charAt(0) != '#') {
                hashtag = '#' + hashtag;
            }

            if(hashtagNameList.includes(hashtag)) {
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

        console.log("### file length list ###")
        console.log("files length = " + files.length);
        console.log("filesArr length = " + filesArr.length);
        console.log("imageFileDict length = " + Object.keys(imageFileDict).length);

        // 업로드 될 파일 총 개수 검사
        let totalFileCnt = Object.keys(imageFileDict).length + filesArr.length
        console.log("totalFileCnt = " + totalFileCnt);
        if (totalFileCnt > MAX_IMAGE_UPLOAD) {
            alert("이미지는 최대 " + MAX_IMAGE_UPLOAD +"개까지 업로드 가능합니다.");
            return;
        }

        filesArr.forEach(function (file) {
            console.log("filesArr forEach: imageFileDictKey = " + imageFileDictKey);
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

function articleModalToggle(action) {
    switch(action) {
        // 게시글 추가
        case "add":
            $('#article-text-div').hide();
            $('#add-article-btn').show();
            $('#article-image-form').show();
            $('#article-location-input-div').show();
            $('#article-hashtag-input-div').show();
            $('#article-textarea').show();

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
            $('#article-text-div').show();
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
    for(let i = 0; i < hashtagNameList.length; i++) {
        if(hashtagNameList[i] == rmHashtag) {
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
    formData.append("text", $('#article-textarea').val());
    formData.append("location", $('#article-location-span').text());
    formData.append("hashtagNameList", hashtagNameList);

    Object.keys(imageFileDict).forEach(function (key) {
        formData.append("imageFileList", imageFileDict[key]);
    });

    $.ajax({
        type: 'POST',
        url: `${LOCALHOST}/articles`,
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
        url: `${LOCALHOST}/articles`,
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
                                <img class="card-img-top" src="${article.imageList[0].url}" alt="Card image cap" width="100px">
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
        url: `${LOCALHOST}/articles/${id}`,
        success: function (response) {
            makeArticleContents(response);
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
    $('#article-location-span').text(article.location);

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
    })
}