let curPos = 0;
let postion = 0;
const IMAGE_WIDTH = 100;
let prevBtn = $("#image-prev-btn");
let nextBtn = $("#image-next-btn");
let images = $("#article-image-list");

console.log("load");

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
    if(curPos < 3){
        console.log(images);
        prevBtn.removeAttr("disabled")
        postion -= IMAGE_WIDTH;
        images.css("transform", `translateX(${postion}px)`);
        curPos = curPos + 1;
    }
    if(curPos == 3){
        nextBtn.attr('disabled', 'true')
    }
}

function initImageControlButton(){
    prevBtn = $("#image-prev-btn");
    nextBtn = $("#image-next-btn");
    images = $("#article-image-list");

    prevBtn.attr('disabled', 'true')
    prevBtn.on("click", prev)
    nextBtn.on("click", next)
}