let curPos = 0;
let position = 0;
const IMAGE_WIDTH = 420;
let prevBtn = $("#image-prev-btn");
let nextBtn = $("#image-next-btn");
let images = $("#article-image-list");

function prev(){
    if(curPos > 0){
        nextBtn.removeAttr("disabled")
        position += IMAGE_WIDTH;
        images.css("transform", `translateX(${position}px)`);
        curPos = curPos - 1;
    }
    if(curPos == 0){
        prevBtn.attr('disabled', 'true')
    }
}

function next(){
    if(totalImageFileCnt <= 1) return;

    if(totalImageFileCnt > 0 && curPos < totalImageFileCnt){
        prevBtn.removeAttr("disabled");
        position -= IMAGE_WIDTH;
        images.css("transform", `translateX(${position}px)`);
        curPos = curPos + 1;
    }

    if(curPos == totalImageFileCnt-1){
        nextBtn.attr('disabled', 'true')
    }
}

function initArticleImageController(){
    prevBtn = $("#image-prev-btn");
    nextBtn = $("#image-next-btn");
    images = $("#article-image-list");
    images.css("transform", `translateX(0px)`);

    curPos = 0;
    position = 0;

    prevBtn.attr('disabled', 'true');
    prevBtn.unbind('click').on("click", prev)
    nextBtn.unbind('click').on("click", next)

    if(totalImageFileCnt > 1) {
        nextBtn.removeAttr("disabled")
    }
    else {
        nextBtn.attr('disabled', 'true');
    }
}