const youtubesearchapi = require('youtube-search-api');

const videoSearch = async (search) => {
    let response = await youtubesearchapi.GetListByKeyword(search,[false],[1])
    let videoUrl = `https://www.youtube.com/watch?v=${response.items[0].id}`
    console.log(videoUrl)
    return response
}


videoSearch("yuyu hakusho opening")

// console.log(video)