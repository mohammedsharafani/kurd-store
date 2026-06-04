// ═══════════════════════════════════════════════════════
//  🔥 FIREBASE CONFIG — KURD STORE
// ═══════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB96ab2JitLryZDR5X1R4DyLQrDIOelsfw",
  authDomain:        "kurd-store-a7a02.firebaseapp.com",
  databaseURL:       "https://kurd-store-a7a02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "kurd-store-a7a02",
  storageBucket:     "kurd-store-a7a02.firebasestorage.app",
  messagingSenderId: "463701517995",
  appId:             "1:463701517995:web:5b7b55401a2e4b4bf379ee",
  measurementId:     "G-D5412RKSG1"
};

const DEFAULT_GAMES = [
  {id:1,title:'God of War Ragnarök',titleKd:'خودای شەڕ',platform:'PS5',category:'ps',price:52000,oldPrice:78000,icon:'⚔️',badge:'sale',stock:true,img:'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/aAbqcQKGqu5lLPhkFlDuBLIF.png'},
  {id:2,title:'Spider-Man 2',titleKd:'سپایدەرمان ٢',platform:'PS5',category:'ps',price:65000,oldPrice:null,icon:'🕷️',badge:'new',stock:true,img:'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/852bf8eeae8f9d43e24a1b8f2be5cf1ea2a856bc52a5ab28.png'},
  {id:3,title:'Halo Infinite',titleKd:'هالۆ ئینفینیت',platform:'Xbox',category:'xbox',price:39000,oldPrice:65000,icon:'🪖',badge:'sale',stock:true,img:'https://store-images.s-microsoft.com/image/apps.2008.13727851868390641.c9cc5571-b89e-4dfe-a2f9-b45ae5bbc653.39ef2e96-04e7-4de7-9f74-2a9b8e19c19b'},
  {id:4,title:'Forza Horizon 5',titleKd:'فۆرزا هۆرایزن ٥',platform:'Xbox',category:'xbox',price:45000,oldPrice:null,icon:'🚗',badge:null,stock:true,img:'https://store-images.s-microsoft.com/image/apps.42935.13846760498042333.5e7c2e2c-5b1d-43df-81d8-20bae2fa94cb.5eae43f5-19aa-4de4-8bf4-37ad2e2ddf12'},
  {id:5,title:'Cyberpunk 2077',titleKd:'سایبەرپانک',platform:'Steam',category:'pc',price:32000,oldPrice:78000,icon:'🌆',badge:'sale',stock:true,img:'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg'},
  {id:6,title:'Elden Ring',titleKd:'ئێلدن ڕینگ',platform:'Steam',category:'pc',price:58000,oldPrice:null,icon:'⚔️',badge:'new',stock:true,img:'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg'},
  {id:7,title:'The Last of Us Part I',titleKd:'دوایین ئێمە',platform:'PS5',category:'ps',price:52000,oldPrice:null,icon:'🌿',badge:null,stock:false,img:'https://image.api.playstation.com/vulcan/ap/rnd/202206/2420/SYoiwRNNKhFSmYCLc1EZxCLz.png'},
  {id:8,title:'FIFA 25',titleKd:'فیفا ٢٥',platform:'Xbox',category:'xbox',price:58000,oldPrice:null,icon:'⚽',badge:'new',stock:true,img:'https://store-images.s-microsoft.com/image/apps.2277.14516464116428681.0a95ef40-1451-4a5c-a12c-0e7c00a462f5.6a2fcfde-f0c4-4a5f-b765-b08b6cdb67b8'},
  {id:9,title:'Mario Kart 8 Deluxe',titleKd:'ماریۆ کارت ٨',platform:'Nintendo',category:'nintendo',price:48000,oldPrice:null,icon:'🏎️',badge:null,stock:true,img:'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000001130/c42553b4941d6c16be25b1c0be06ead2d10a4f18b8b22ee39f3af5dd56dd66b'},
  {id:10,title:'GTA V',titleKd:'جی تی ئەی ٥',platform:'Steam',category:'pc',price:28000,oldPrice:52000,icon:'🏙️',badge:'sale',stock:true,img:'https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg'},
];
const DEFAULT_SUBS = [
  {id:'ps',icon:'🎮',name:'PlayStation Plus',nameKd:'پلەیستەیشن پڵەس',desc:'Free monthly games, online multiplayer & exclusive discounts.',cls:'ps',options:[{label:'1 Month',price:10000},{label:'3 Months',price:26000},{label:'12 Months',price:78000}]},
  {id:'xbox',icon:'🟢',name:'Xbox Game Pass',nameKd:'ئێکسباکس گەیم پاس',desc:'Hundreds of games on console, PC & cloud. New games every month.',cls:'xbox',options:[{label:'1 Month',price:13000},{label:'3 Months',price:32000},{label:'12 Months',price:104000}]},
  {id:'ea',icon:'🎯',name:'EA Play',nameKd:'ئی ئەی پلەی',desc:'Play EA titles like FIFA, Battlefield & Apex Legends.',cls:'ea',options:[{label:'1 Month',price:6500},{label:'12 Months',price:39000}]},
  {id:'nintendo',icon:'🔴',name:'Nintendo Online',nameKd:'نینتەندۆ ئۆنلاین',desc:'Online play, classic NES & SNES games & member offers.',cls:'nintendo',options:[{label:'1 Month',price:5200},{label:'12 Months',price:26000}]},
];
const DEFAULT_SETTINGS = {
  storeName:'Kurd Store',storeNameKd:'کورد ستۆر',
  tagline:'Your Kurdish Gaming Store',taglineKd:'دوکانی یاری کوردیەکەت',
  logoImg:'',logoEmoji:'🎮',telegram:'sharafaani',
};
const DEFAULT_CODES = {};  // Always read from Firebase — no hardcoded codes
const DEFAULT_REVIEWS = [
  {id:1,name:'Ahmed K.',game:'God of War Ragnarök',stars:5,text:'Amazing game, got the key instantly!',date:'2024-01-15'},
  {id:2,name:'Sara M.',game:'PlayStation Plus',stars:5,text:'Very fast and trustworthy. Kurdish support is great!',date:'2024-01-20'},
  {id:3,name:'Karwan H.',game:'Cyberpunk 2077',stars:4,text:'Good price and quick delivery.',date:'2024-01-22'},
];
const PAYMENT_METHODS = [
  {id:'fib', name:'FIB — First Iraqi Bank',nameKd:'بانکی عێراقی یەکەم',number:'7503105614',icon:'🏦'},
  {id:'qi',  name:'Qi Card',               nameKd:'کارتی قی',           number:'8328816726',icon:'💳'},
  {id:'fast',name:'Fastpay',               nameKd:'فاستپەی',            number:'7503105614',icon:'⚡'},
];
