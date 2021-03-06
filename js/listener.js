function registerEventListener() {
    $("#tag-input").keydown(function (e) {
        if (e.keyCode == 13) {
            articleTagInput();
        }
    });
    $("#tag-input-btn").on("click", articleTagInput);
    $('#article-images').on('change', function (e) {
        articleImageInput(e);
    });

    // modal hide 리스너
    $('#article-modal').on('hidden.bs.modal', modalHiddenListener);

    // modal show 리스너
    $('#article-modal').on('show.bs.modal', modalShowListener);
}

function articleTagInput() {
    // 엔터키 입력 체크

    let tag = $('#tag-input').val();
    if (tag == '' || tag == '#') {
        return;
    }

    // 사용자가 # 을 같이 입력한 경우 # 제거
    if (!tag.charAt(0) == '#') {
        tag = tag.substring(1);
    }

    if (tagNames.includes(tag)) {
        alert("이미 입력한 해시태그입니다.");
        $('#tag-input').val('');
        return;
    }

    tagNames.push(tag);

    let tmpSpan = `<span class="tag" 
                         style="background-color: ${createRandomColor()}" 
                         onclick="removeTag(this, '${tag}')">#${tag}</span>`;
    $('#tag-list').append(tmpSpan);

    $('#tag-input').val('');

}

function articleImageInput(e) {
    let files = e.target.files;
    let filesArr = Array.prototype.slice.call(files);

    // 업로드 될 파일 총 개수 검사
    totalImageFileCnt += filesArr.length
    if (totalImageFileCnt > MAX_IMAGE_UPLOAD) {
        alert("이미지는 최대 " + MAX_IMAGE_UPLOAD + "개까지 업로드 가능합니다.");
        totalImageFileCnt -= filesArr.length;

        return;
    }

    filesArr.forEach(function (file) {
        if (!file.type.match("image.*")) {
            alert("이미지 파일만 업로드 가능합니다.");
            return;
        }

        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            uploadImage(file, e.target.result);
        };
    });

    e.target.value = '';
    initArticleImageController();
}

function modalHiddenListener() {
    // 이전에 입력되었던 내용 삭제
    tagNames = [];
    uploadImageIds = [];
    tmpImageId = 0;
    totalImageFileCnt = 0;
    deleteSelectLocation();
    initArticleImageController();

    $('#article-images').val('');
    $('#article-textarea').val('');
    $('.modal-dynamic-contents').empty();

    articleStatus = "-list";
}

function modalShowListener() {
    articleStatus = "-modal";
}

window.addEventListener("scroll", function () {
    const SCROLLED_HEIGHT = window.scrollY;
    const WINDOW_HEIGHT = window.innerHeight;
    const DOC_TOTAL_HEIGHT = document.body.offsetHeight;
    const IS_END = (WINDOW_HEIGHT + SCROLLED_HEIGHT > DOC_TOTAL_HEIGHT - 500);


    if (IS_END && !isApiCalling && !lastPage) {
        showArticles();
    }
});

let searchSource = [];
// 태그 검색 리스너
function searchEventListener() {
    $("#search-tag").autocomplete({
        source : searchSource,
        select : function(event, ui) {
            $("#search-tag").val(ui.item.value);
            searchArticle();
        },
        focus : function(event, ui) {
            return false;
        },
        minLength: 1,
        autoFocus: true,
        classes: {
            "ui-autocomplete": "highlight"
        },
        delay: 500,
        position: { my : "right top", at: "right bottom" }
    });
}

function getSearchSource() {
    if (!searchSource.length) {
        $.ajax({
            type: 'GET',
            url: `${WEB_SERVER_DOMAIN}/search`,
            success: function (data) {
                searchSource = data
                searchEventListener();
            }
        });
    }

}