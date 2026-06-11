/* ==========================================================
   行记 — album manifest
   Drives album.html and the homepage album links.
   layout: full | pano | wide | std | tall
   ========================================================== */

window.ALBUMS = {
  qinghai: {
    no: '01', cn: '青海', title: 'The Highland Light',
    sub: 'Qinghai — 3,000 metres up, the sky is a mirror and the grass runs to every horizon.',
    dark: false,
    photos: [
      { src: 'assets/img/chaka1.webp',   cap: '茶卡盐湖 — the mirror of the sky', l: 'full' },
      { src: 'assets/img/qjpano.webp',    cap: '祁连山中 — the road over the pass', l: 'pano' },
      { src: 'assets/img/lake1.webp',    cap: 'a gate left open to Qinghai Lake', l: 'wide' },
      { src: 'assets/img/chaka2.webp',   cap: 'the lake, held in one hand', l: 'std' },
      { src: 'assets/img/qinghai1.webp', cap: 'rain coming over the spruce', l: 'wide' },
      { src: 'assets/img/Qinghai3.webp',  cap: 'pylons walking the yellow hills', l: 'tall' },
      { src: 'assets/img/ta1.webp',      cap: '塔尔寺 — a door into incense', l: 'tall' },

      { src: 'assets/img/pano.webp',      cap: 'clouds filing across the plateau', l: 'pano' },
      { src: 'assets/img/qh10.webp',     cap: 'the lake takes the fire calmly', l: 'full' },
      { src: 'assets/img/pano2.webp',    cap: 'big sky country, highland edition', l: 'pano' },
    ],
  },

  lijiang: {
    no: '02', cn: '丽江', title: 'Where the Snow Mountain Watches',
    sub: 'Lijiang — the Jade Dragon keeps thirteen peaks, and every street ends in one of them.',
    dark: false,
    photos: [
      { src: 'assets/img/lijiang1.webp', cap: '蓝月谷 — glacier water, the colour of weather', l: 'full' },
      { src: 'assets/img/lij1.webp',     cap: 'the dry meadow at 3,200 m', l: 'tall' },
      { src: 'assets/img/lijiang4.webp', cap: 'thirteen peaks, counted twice', l: 'wide' },
      { src: 'assets/img/lij2.webp',    cap: 'the mountain, framed by someone’s wish', l: 'tall' },
      { src: 'assets/img/lijiang3.webp', cap: '经幡 — wind reading the prayers aloud', l: 'full' },
      { src: 'assets/img/lijiang5.webp', cap: 'where the trees give up', l: 'wide' },
      { src: 'assets/img/mainli.webp',  cap: 'the glacier keeps to itself', l: 'std' },
      { src: 'assets/img/cow.webp',       cap: 'a local, unimpressed', l: 'std' },
    ],
  },

  chongqing: {
    no: '03', cn: '重庆', title: 'Neon Gorge',
    sub: 'Chongqing — a city stacked on a mountain, wired with light, allergic to flat ground.',
    dark: true,
    photos: [
      { src: 'assets/img/chongqing1.webp', cap: '千厮门大桥 — the bridge takes the colour of luck', l: 'full' },
      { src: 'assets/img/cq2.webp',       cap: 'a stair between two midnights', l: 'tall' },
      { src: 'assets/img/cq4.webp',       cap: 'the horizontal skyscraper, weather incoming', l: 'tall' },
      { src: 'assets/img/cq5.webp',       cap: 'every lane votes for the skyline', l: 'full' },
      { src: 'assets/img/cq3.webp',       cap: '两江交汇 — two rivers shake hands, in silver', l: 'pano' },
    ],
  },

  japan: {
    no: '04', cn: '日本', title: 'Ten Thousand Gates',
    sub: 'Japan — a country that files its miracles neatly: one volcano, ten thousand torii, trains on time.',
    dark: false,
    photos: [
      { src: 'assets/img/fuj1.webp',     cap: '富士山 — the volcano keeps its smoke politely to one side', l: 'tall' },
      { src: 'assets/img/fuji1.webp',   cap: 'the gate and the mountain agree on red', l: 'full' },
      { src: 'assets/img/kyo1.webp',     cap: 'steps that ask you to slow down', l: 'tall' },
      { src: 'assets/img/kyo3.webp',    cap: '清水寺 — the city kept in a wooden frame', l: 'tall' },
      { src: 'assets/img/kyo2.webp',    cap: 'the pagoda has seen your photo before', l: 'tall' },
      { src: 'assets/img/temple1.webp',  cap: 'the cedars are the congregation', l: 'wide' },
      { src: 'assets/img/japan1.webp',   cap: 'guarded by two patient lions', l: 'std' },
      { src: 'assets/img/kyo4.webp',    cap: 'a lantern over the steps at dusk', l: 'tall' },
      { src: 'assets/img/kyotonew.webp', cap: 'the driver’s view, borrowed', l: 'tall' },
      { src: 'assets/img/fuji2.webp',    cap: '新宿 — signage as weather', l: 'tall' },
      { src: 'assets/img/kyoto1.webp',   cap: '千本鳥居 — a thousand gates, and the dark between them', l: 'full' },
      { src: 'assets/img/tok00.webp',    cap: 'Tokyo — a circuit that never sleeps', l: 'wide' },
      { src: 'assets/img/osa.webp',     cap: 'an alley with its own opinion of light', l: 'tall' },
      { src: 'assets/img/osakanew.webp', cap: '道頓堀 — the street that shouts dinner', l: 'std' },
      { src: 'assets/img/liuli.webp',    cap: '琉璃 — autumn, reflected in lacquer and glass', l: 'full' },
      { src: 'assets/img/liulinew.webp', cap: 'the moss is the oldest resident', l: 'wide' },
    ],
  },

  beijing: {
    no: '05', cn: '北京', title: 'The Garden of Clear Ripples',
    sub: 'Beijing — the Summer Palace at closing hour, when the lake gets the light to itself.',
    dark: false,
    photos: [
      { src: 'assets/img/yih1.webp',     cap: '佛香阁 — the tower above the green', l: 'tall' },
      { src: 'assets/img/yih3.webp',     cap: 'a gate dressed for the occasion', l: 'wide' },
      { src: 'assets/img/yih2.webp',    cap: 'the cloud auditions for a mountain', l: 'tall' },
      { src: 'assets/img/yih4.webp',    cap: '玉泉塔 — across the water, smaller than memory', l: 'tall' },
      { src: 'assets/img/yih6.webp',    cap: 'willows combing the late light', l: 'tall' },
    
      { src: 'assets/img/yih5.webp',    cap: 'she got the best seat and knows it', l: 'tall' },
    ],
  },

  iphone: {
    no: '06', cn: '随拍', title: 'Shot on iPhone',
    sub: 'The Atlantic side of the notebook — soft light, long grass, a phone for a camera.',
    dark: false,
    photos: [
      { src: 'assets/img/iphone1.webp',  cap: 'the ocean closes for the day', l: 'full' },
      { src: 'assets/img/iphone8.webp',  cap: 'two birds, two opinions', l: 'tall' },
      { src: 'assets/img/iphone6.webp',   cap: 'spring files a report', l: 'wide' },
      { src: 'assets/img/iphone2.webp',   cap: 'the harbor’s slow traffic', l: 'tall' },
      { src: 'assets/img/iphone9.webp',  cap: 'everyone stays for the last act', l: 'tall' },
      { src: 'assets/img/iphone4.webp',   cap: 'the rules, beautifully lit', l: 'tall' },
      { src: 'assets/img/iphone7.webp',   cap: 'the dune’s standing army', l: 'wide' },
      { src: 'assets/img/iphone10.webp', cap: 'dusk in violet ink', l: 'std' },
      { src: 'assets/img/iphone3.webp',  cap: 'Philadelphia, October edition', l: 'wide' },
      { src: 'assets/img/iphone5.webp',   cap: 'the ocean signs its work', l: 'std' },
      { src: 'assets/img/shotoniphone2.webp',  cap: 'Pier 39', l: 'tall' },
      { src: 'assets/img/shotoniphone.webp', cap: 'The Golden Gate Bridge in [Karl the fog]', l: 'wide' },
      { src: 'assets/img/shotoniphone3.webp', cap: 'the city, briefly still', l: 'full' },
      { src: 'assets/img/shotoniphone4.webp', cap: 'Market Street and the Ferry Building at San Fransico', l: 'std' },
    ],
  },
};

window.ALBUM_ORDER = ['qinghai', 'lijiang', 'chongqing', 'japan', 'beijing', 'iphone'];
