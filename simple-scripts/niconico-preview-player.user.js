// ==UserScript==
// @name        niconico instant play
// @description なんか判定が微妙なので使わないように
// @namespace   https://rinsuki.net/
// @match       https://www.nicovideo.jp/tag/*
// @grant       none
// @version     1.0
// @author      rinsuki
// ==/UserScript==

(() => {
    function generateActionTrackID() {
        let randomPart = ""
        const parts = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        for (let i=0; i<10; i++) {
            randomPart += parts[Math.floor(Math.random() * parts.length)]
        }
        return `${randomPart}_${Date.now()}`
    }

    /** @type {NodeListOf<HTMLAnchorElement>} */
    const thumbWraps = document.querySelectorAll(".column.main .item:not(.nicoadVideoItem) a.itemThumbWrap")
    for (const thumbWrap of thumbWraps) {
        const videoIdArr = /\/watch\/([a-z0-9]+)/.exec(thumbWrap.pathname)
        if (videoIdArr == null) continue
        const videoId = videoIdArr[1]
        let timer = null
        /** @type {HTMLVideoElement} */
        let video = null
        let session = null
        let hoverElem = thumbWrap
        while (!hoverElem.classList.contains("item")) {
            hoverElem = hoverElem.parentElement
        }
        hoverElem.addEventListener("mouseenter", () => {
            timer = setTimeout(() => {
                // plays
                const apiURL = new URL("https://www.nicovideo.jp/api/watch/v3_guest/" + videoId)
                apiURL.searchParams.append("_frontendId", "6")
                apiURL.searchParams.append("_frontendVersion", "0")
                apiURL.searchParams.append("actionTrackId", generateActionTrackID())
                apiURL.searchParams.append("noSideEffect", "true")
                apiURL.searchParams.append("skips", "harmful")
                fetch(apiURL).then(res => res.json()).then(json => {
                    console.log(json)
                    const { delivery } = json.data.media
                    if (delivery.encryption != null) return
                    fetch("https://api.dmc.nico/api/sessions?_format=json", {
                        method: "POST",
                        body: JSON.stringify({
                            session: {
                                client_info: {
                                    player_id: delivery.movie.session.playerId,
                                },
                                content_auth: {
                                    auth_type: "ht2",
                                    content_key_timeout: delivery.movie.session.contentKeyTimeout,
                                    service_id: "nicovideo",
                                    service_user_id: delivery.movie.session.serviceUserId,
                                },
                                content_id: delivery.movie.session.contentId,
                                content_src_id_sets: [
                                    {
                                        content_src_ids: [
                                            {
                                                src_id_to_mux: {
                                                    audio_src_ids: [delivery.movie.audios.sort((a, b) => a.metadata.bitrate - b.metadata.bitrate)[0].id],
                                                    video_src_ids: [delivery.movie.videos.sort((a, b) => a.metadata.bitrate - b.metadata.bitrate)[0].id],
                                                }
                                            }
                                        ]
                                    }
                                ],
                                content_type: "movie",
                                contnet_uri: "",
                                keep_method: {
                                    heartbeat: {
                                        lifetime: delivery.movie.session.heartbeatLifetime,
                                    }
                                },
                                priority: delivery.movie.session.priority,
                                protocol: {
                                    name: "http",
                                    parameters: {
                                        http_parameters: {
                                            parameters: {
                                                http_output_download_parameters: {
                                                    transfer_preset: "",
                                                }
                                            }
                                        }
                                    }
                                },
                                recipe_id: delivery.movie.session.recipeId,
                                session_operation_auth: {
                                    session_operation_auth_by_signature: {
                                        signature: delivery.movie.session.signature,
                                        token: delivery.movie.session.token,
                                    }
                                },
                                timing_constraint: "unlimited"
                            },
                        })
                    }).then(r => r.json()).then(json => {
                        session = json.data.session
                        video = document.createElement("video")
                        video.src = session.content_uri
                        video.style.position = "absolute"
                        video.style.top = 0
                        video.style.left = 0
                        video.style.width = "100%"
                        video.style.aspectRatio = "16 / 9"
                        video.style.zIndex = 2147483646
                        video.style.opacity = 0
                        video.style.transition = "0.5s opacity"
                        video.volume = 0.25
                        video.autoplay = true
                        thumbWrap.appendChild(video)
                        video.addEventListener("playing", () => {
                            video.style.opacity = 1
                        })
                    })
                })
            }, 1000);
        })
        hoverElem.addEventListener("mouseleave", () => {
            clearTimeout(timer)
            video?.remove()
            if (session != null) {
                fetch("https://api.dmc.nico/api/sessions/" + session.id + "?_format=json&_method=DELETE", {
                    method: "POST",
                    body: JSON.stringify({
                        session,
                    })
                })
            }
        })
    }
})()