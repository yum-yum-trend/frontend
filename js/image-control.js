let curPos = 0;
let postion = 0;
const IMAGE_WIDTH = 420;
let prevBtn = $("#image-prev-btn");
let nextBtn = $("#image-next-btn");
let images = $("#article-image-list");

function prev(){
    if(curPos > 0){
        nextBtn.removeAttr("disabled")
        postion += IMAGE_WIDTH;
        images.css("transform", `translateX(${postion}px)`);
        curPos = curPos - 1;
    }
    if(curPos == 0){
        prevBtn.attr('disabled', 'true')
    }
}

function next(){
    if(totalImageFileCnt <= 1) return;

    if(totalImageFileCnt > 0 && curPos < totalImageFileCnt){
        console.log(images);
        prevBtn.removeAttr("disabled");
        postion -= IMAGE_WIDTH;
        images.css("transform", `translateX(${postion}px)`);
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
    postion = 0;

    prevBtn.attr('disabled', 'true');
    prevBtn.unbind('click').on("click", prev)
    nextBtn.unbind('click').on("click", next)
}