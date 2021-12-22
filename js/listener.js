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
    totalImageFileCnt = Object.keys(imageFileDict).length + filesArr.length
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

        // FIXME: <div> slider
        let reader = new FileReader();
        reader.onload = function (e) {
            imageFileDict[imageFileDictKey] = file;

            let tmpHtml = `<div class="article-image-container article-image" id="image-${imageFileDictKey}">
                                <img src="${e.target.result}" data-file=${file.name} 
                                         />
                                <div class="article-image-container-middle" onclick="removeImageElement(${imageFileDictKey++})">
                                    <div class="text">삭제</div>
                                </div>
                           </div>`
            $('#article-image-list').append(tmpHtml);
        };
        reader.readAsDataURL(file);
    });

    initArticleImageController();
}

function modalHiddenListener() {
    // 이전에 입력되었던 내용 삭제
    tagNames = [];
    rmImageIds = [];
    imageFileDict = {};
    imageFileDictKey = 0;
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
