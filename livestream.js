let follow_id = []
let streamers = []
let possible_pagination = ""

async function getAfterPagination(user_id) {
    let twitchHeader = new Headers();
    twitchHeader.append('Authorization', 'Bearer ' +  config.AUTH_TOKEN)
    twitchHeader.append('Client-Id', config.CLIENT_ID)

    var myInit = {
        method: 'GET',
        headers: twitchHeader,
        mode: 'cors',
        cache: 'default'
    }

    while(possible_pagination != null) {
        let myRequest = new Request(`https://api.twitch.tv/helix/users/follows?from_id=${user_id}&after=${possible_pagination}`, myInit)

        await fetch(myRequest).then(function(response) {
            return response.json()
            .then(jsonResponse => {
                for (let i = 0; i <jsonResponse.data.length; i++){
                    follow_id.push(jsonResponse.data[i].to_id)
                }
                possible_pagination = jsonResponse.pagination.cursor
            })
        })
    }
}

async function getUserId() {
    let twitchHeader = new Headers();
    twitchHeader.append('Authorization', 'Bearer ' +  config.AUTH_TOKEN)
    twitchHeader.append('Client-Id', config.CLIENT_ID)

    var myInit = {
        method: 'GET',
        headers: twitchHeader,
        mode: 'cors',
        cache: 'default'
    }

    let myRequest = new Request(`https://api.twitch.tv/helix/users?login=terpomal`, myInit)

    let userID = ""

    userID = fetch(myRequest).then(function(response) {
        return response.json()
        .then(jsonResponse => {
            return jsonResponse.data[0].id
        })
    })
    return userID
}

async function getFollowedUsers(id) {
    let twitchHeader = new Headers();
    twitchHeader.append('Authorization', 'Bearer ' +  config.AUTH_TOKEN)
    twitchHeader.append('Client-Id', config.CLIENT_ID)

    var myInit = {
        method: 'GET',
        headers: twitchHeader,
        mode: 'cors',
        cache: 'default'
    }

    let myRequest = new Request(`https://api.twitch.tv/helix/users/follows?from_id=${id}`, myInit)

    await fetch(myRequest).then(function(response) {
        return response.json()
        .then(jsonResponse => {
            for (let i = 0; i <jsonResponse.data.length; i++){
                follow_id.push(jsonResponse.data[i].to_id)
            }
            possible_pagination = jsonResponse.pagination.cursor
        })
    })

    if (possible_pagination != null) {
        getAfterPagination(id)
    }
}

async function constructStreamers() {

    // streamers : [
        //      {
        //         streamer_id : int,
        //         streamer_name : String,
        //         profilePic : String,
        //         stream_live: Boolean,
        //         stream_title: String | null,
        //         viewer_count: Int | null,
        //         game_title: String | null,
        //         stream_url: String,
        //     },
    //     ...
    // ]
    let twitchHeader = new Headers();
    twitchHeader.append('Authorization', 'Bearer ' +  config.AUTH_TOKEN)
    twitchHeader.append('Client-Id', config.CLIENT_ID)

    var myInit = {
        method: 'GET',
        headers: twitchHeader,
        mode: 'cors',
        cache: 'default'
    }

    for (let i = 0; i < follow_id.length; i++) {
        streamer_info = {}
        streamer_info['streamer_id'] = follow_id[i]
        //Get User Information
        let myRequest = new Request(`https://api.twitch.tv/helix/users?id=${follow_id[i]}`, myInit)
        await fetch(myRequest).then(function(response) {
            response.json()
            .then(jsonResponse => {
                console.log(jsonResponse)
                streamer_info['streamer_name'] = jsonResponse.data[0].display_name
                streamer_info['streamer_profile_pic'] = jsonResponse.data[0].profile_image_url
            })
        })

        myRequest = new Request(`https://api.twitch.tv/helix/streams?user_id=${follow_id[i]}`, myInit)
        await fetch(myRequest).then(function(response) {
            return response.json()
            .then(jsonResponse => {
                // if (jsonResponse.data.length !== 0){
                //     streamer_info['stream_live'] = true
                //     streamer_info['stream_title'] = jsonResponse.data[0].title
                //     streamer_info['viewer_count'] = jsonResponse.data[0].viewer_count
                //     streamer_info['game_title'] = jsonResponse.data[0].game_name
                // }
                // else
                // {
                //     streamer_info['stream_live'] = false
                //     streamer_info['stream_title'] = null
                //     streamer_info['viewer_count'] = null
                //     streamer_info['game_title'] = null
                // }
                streamer_info['stream_live'] = false
                streamer_info['stream_title'] = null
                streamer_info['viewer_count'] = null
                streamer_info['game_title'] = null
            })
        })

        streamer_info['stream_url'] = `https://twitch.tv/${streamer_info['streamer_name'].toLowerCase()}`

        streamers.push(streamer_info)
    }   
}

async function updateLiveStreams() {

    let twitchHeader = new Headers();
    twitchHeader.append('Authorization', 'Bearer ' +  config.AUTH_TOKEN)
    twitchHeader.append('Client-Id', config.CLIENT_ID)

    var myInit = {
        method: 'GET',
        headers: twitchHeader,
        mode: 'cors',
        cache: 'default'
    }

    for (let i = 0; i < streamers.length; i++) {
        myRequest = new Request(`https://api.twitch.tv/helix/streams?user_id=${streamers[i].streamer_id}`, myInit)
        await fetch(myRequest).then(function(response) {
            return response.json()
            .then(jsonResponse => {
                if (jsonResponse.data.length !== 0){
                    streamers[i].stream_live = true
                    streamers[i].stream_title = jsonResponse.data[0].title
                    streamers[i].viewer_count = jsonResponse.data[0].viewer_count
                    streamers[i].game_title = jsonResponse.data[0].game_name
                }
            })
        })
    }
}


function insertHTMLStreamer(streamer) {
    content = document.getElementById("main-content")
        var streamer_box = document.createElement("div")
        streamer_box.setAttribute("id", "streamer");
        streamer_box.setAttribute("class", "streamer");
        streamer_box.className += (streamer.stream_live == true ? " live" : "" )

        var streamer_profile_pic = document.createElement("img")
        streamer_profile_pic.setAttribute("class", "pfp");
        streamer_profile_pic.setAttribute("src", `${streamer.streamer_profile_pic}`);
        streamer_box.appendChild(streamer_profile_pic)

        var streamers_name = document.createElement("p")
        streamers_name.setAttribute("class", "streamer-name");
        streamers_name.innerHTML = `${streamer.streamer_name}`;
        streamer_box.appendChild(streamers_name);

        var streamers_game = document.createElement("p")
        streamers_game.setAttribute("class", "streamer-game");
        streamers_game.innerHTML = `Game: ${streamer.game_title == null ? "N/A" : streamer.game_title}`
        streamer_box.appendChild(streamers_game);

        if(streamer.viewer_count !== null) {
            var streamer_count_div = document.createElement("div");
            streamer_count_div.setAttribute("class", "view-count");
            var viewer_icon = document.createElement("img");
            var streamer_count = document.createElement("p");
            viewer_icon.setAttribute("src", "icons/user.svg");
            viewer_icon.setAttribute("height", "10");
            viewer_icon.setAttribute("height", "10");
            streamer_count.setAttribute("class", "viwer-number")
            streamer_count.innerHTML = `${streamer.viewer_count}`;
            streamer_count_div.appendChild(viewer_icon);
            streamer_count_div.appendChild(streamer_count);
            streamer_box.appendChild(streamer_count_div);
        }

        var streamer_url = document.createElement("a");
        streamer_url.setAttribute("class", "arrow-link");
        streamer_url.setAttribute("href", `${streamer.stream_url}`);
        streamer_url.setAttribute("target", "_blank");
        var arrow_icon = document.createElement("img");
        arrow_icon.setAttribute("src", "icons/caret-right-solid.svg");
        arrow_icon.setAttribute("height", "87");
        arrow_icon.setAttribute("height", "100");
        streamer_url.appendChild(arrow_icon);
        streamer_box.appendChild(streamer_url);

        content.appendChild(streamer_box);
}

document.addEventListener('DOMContentLoaded', async () => {
    if(localStorage.getItem("followedStreamers") === null) {
        const userID = await getUserId() //async and await is nw standard JS 
        await getFollowedUsers(userID)
        await constructStreamers()
        localStorage.setItem("followedStreamers", JSON.stringify(streamers));
    }
    else {
        streamers = JSON.parse(localStorage.getItem("followedStreamers"));
        console.log(streamers);
    }
    //Update streamers count and game title
    await updateLiveStreams();

   streamers.sort((a,b) => b.viewer_count - a.viewer_count)
    document.getElementById("search-box").style.display = "none";
    for (let i = 0; i < streamers.length; i++) {
        insertHTMLStreamer(streamers[i])
    }
    //Need to implement a way to limit amount of streamers shown, but increase if scroll down
})