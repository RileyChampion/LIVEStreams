let follow_id = []
let streamers = []

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
            console.log(jsonResponse.pagination)
            for (let i = 0; i <jsonResponse.data.length; i++){
                follow_id.push(jsonResponse.data[i].to_id)
            }
        })
    })

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
        console.log('hahah')
        streamer_info = {}
        streamer_info['streamer_id'] = follow_id[i]
        //Get User Information
        let myRequest = new Request(`https://api.twitch.tv/helix/users?id=${follow_id[i]}`, myInit)
        await fetch(myRequest).then(function(response) {
            return response.json()
            .then(jsonResponse => {
                streamer_info['streamer_name'] = jsonResponse.data[0].user_name
                streamer_info['streamer_profile_pic'] = jsonResponse.data[0].profile_image_url
            })
        })

        myRequest = new Request(`https://api.twitch.tv/helix/streams?user_id=${follow_id[i]}`, myInit)
        await fetch(myRequest).then(function(response) {
            return response.json()
            .then(jsonResponse => {
                console.log(jsonResponse.data)
                if (jsonResponse.data.length !== 0){
                    streamer_info['stream_live'] = true
                    streamer_info['stream_title'] = jsonResponse.data[0].title
                    streamer_info['viewer_count'] = jsonResponse.data[0].viewer_count
                    streamer_info['game_title'] = jsonResponse.data[0].game_name
                }
                else
                {
                    streamer_info['stream_live'] = true
                    streamer_info['stream_title'] = null
                    streamer_info['viewer_count'] = null
                    streamer_info['game_title'] = null
                }
            })
        })

        streamer_info['stream_url'] = `https://twitch.tv/${streamer_info['streamer_name']}`

        streamers.push(streamer_info)
    }   
}

document.addEventListener('DOMContentLoaded', async () => {

    const userID = await getUserId() //async and await is nw standard JS 
    await getFollowedUsers(userID)
    await constructStreamers()
})