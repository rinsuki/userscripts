const style = document.createElement("style")
// CSS Class Prefix
export const ccPrefix = "userjs-gentenkaiki"
style.innerText = `
body.${ccPrefix}-now .${ccPrefix}-start { display: none; }
body.${ccPrefix}-enableytclick .VideoSymbolContainer,
body.${ccPrefix}-enableytclick .CommentRenderer { pointer-events: none; }
body.${ccPrefix}-now #MainVideoPlayer > video { display: none !important; }

.${ccPrefix}-wrapper { z-index: 0; }
.${ccPrefix}-wrapper, .${ccPrefix}-wrapper > iframe { position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; }
.${ccPrefix}-wrapper > iframe { z-index: 1; }
body:not(.${ccPrefix}-enableytclick) .${ccPrefix}-player > iframe { pointer-events: none; }
.${ccPrefix}-ytb-b { fill: #fff }
.${ccPrefix}-ytb-p { fill: #000 }
body.${ccPrefix}-enableytclick .${ccPrefix}-ytb-b { fill: #f00 }
body.${ccPrefix}-enableytclick #UadPlayer { pointer-events: none; }
`

document.head.appendChild(style)