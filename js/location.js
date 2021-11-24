let gLat;
let gLng;
let gLocationInfo = {};
const KAKAO_LOCATION_MAX_RESULT = 9;
const KAKAO_LOCATION_SIZE = 5;

// 위치정보 입력 리스너
function locationRegisterEventListener() {
    $('#search-input').on('keypress', function (e) {
        if (e.key == 'Enter') {
            getLocation(1);
        }
    });
}

function gpsSetting() {
    if ($("#gps-setting").children().hasClass("fa-map-marker-alt")) {
        $("#gps-setting").children().addClass("fa-map-marker")
        $("#gps-setting").children().removeClass("fa-map-marker-alt")
        gLat = undefined;
        gLng = undefined;
    } else {
        $("#gps-setting").children().addClass("fa-map-marker-alt")
        $("#gps-setting").children().removeClass("fa-map-marker")
        getCoordinate()
    }
}

function getCoordinate() {
    $.ajax({
        type: "POST",
        url: `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_GEOLOCATION_API_KEY}`,
        data: {},
        success: function (response) {
            let location = response.location;
            gLat = location.lat;
            gLng = location.lng;
            console.log(gLat, gLng);
        }
    })
}

function getLocation(currentPage) {
    deleteSelectLocation()
    $("#article-location-list-div").empty();

    console.log(currentPage)
    $.ajax({
        type: "GET",
        url: (gLat
            ? `https://dapi.kakao.com/v2/local/search/keyword.json?y=${gLat}&x=${gLng}&radius=2000&page=${currentPage}&size=${KAKAO_LOCATION_SIZE}&query=` + encodeURIComponent($("#search-input").val())
            : `https://dapi.kakao.com/v2/local/search/keyword.json?&page=${currentPage}&size=${KAKAO_LOCATION_SIZE}&query=` + encodeURIComponent($("#search-input").val())),
        headers: {'Authorization': `KakaoAK ${KAKAO_SEARCH_API_KEY}`},
        success: function (response) {
            console.log(response)
            let tempHtml = ``
            let locationInfoList = response.documents
            let pagingInfo = response.meta
            if (parseInt(pagingInfo.total_count / KAKAO_LOCATION_SIZE) >= KAKAO_LOCATION_MAX_RESULT) {
                pagingInfo.totalPage = pagingInfo.totalPage = KAKAO_LOCATION_MAX_RESULT;
            } else {
                if (pagingInfo.total_count % KAKAO_LOCATION_SIZE == 0) {
                    pagingInfo.totalPage = parseInt(pagingInfo.total_count / KAKAO_LOCATION_SIZE);
                } else {
                    pagingInfo.totalPage = parseInt(pagingInfo.total_count / KAKAO_LOCATION_SIZE) + 1;
                }
            }
            pagingInfo.currentPage = currentPage;
            for (let i = 0; i < locationInfoList.length; i++) {
                tempHtml = addLocationList(locationInfoList[i], i + 1)
                $("#article-location-list-div").append(tempHtml);
            }
            addPaging(pagingInfo, currentPage - 1);
        },
        error: function (e) {
            console.log(e);
        }
    })
}

function addLocationList(locationInfo, idx) {
    let roadAddressName = locationInfo.road_address_name;
    let placeName = locationInfo.place_name;
    let xCoordinate = locationInfo.x;
    let yCoordinate = locationInfo.y;
    let categoryName = locationInfo.category_name
    return `<div>
                <a href="#" class="location-list-font-size" onclick="selectLocation(${idx})">${placeName} (${roadAddressName})</a>
                <span id="location-idx-${idx}" hidden>${roadAddressName}@${placeName}@${xCoordinate}@${yCoordinate}@${categoryName}</span>
            </div>`
}

function addPaging(pagingInfo, currentPage) {
    let tempHtml = ``;
    for (let i = Math.max(currentPage - 3, 0); i < Math.max(0, Math.min(pagingInfo.totalPage, currentPage + 3)); i++) {
        if (i + 1 == pagingInfo.currentPage) {
            tempHtml += `<li class="page-item-sm active"><a class="page-link" href="#">${i + 1}</a></li>`;
        } else {
            tempHtml += `<li class="page-item-sm"><a class="page-link" href="#" onclick="getLocation(${i + 1})">${i + 1}</a></li>`;
        }
    }
    $("#pagination").html(tempHtml)
}

function selectLocation(idx) {
    deleteSelectLocation()
    let locationInfoString = $(`#location-idx-${idx}`).text()
    let locationInfoArray = locationInfoString.split("@")
    gLocationInfo = {
        "roadAddressName": locationInfoArray[0],
        "placeName": locationInfoArray[1],
        "xCoordinate": locationInfoArray[2],
        "yCoordinate": locationInfoArray[3],
        "categoryName": locationInfoArray[4],
    }
    let tempHtml = `<li>${locationInfoArray[1]} <i class="fas fa-times"></i></li>`


    $("#article-location-span").html(tempHtml)
    $("#article-location-list-div").empty();
    $("#pagination").empty();
    $("#search-input").val("");

    console.log(gLocationInfo)

}

function deleteSelectLocation() {
    $("#article-location-span").empty();
    gLocationInfo = {}
}