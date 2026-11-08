/* =====================================================================
   KOREA 2027 — PUBLIC TRIP DATA
   ---------------------------------------------------------------------
   This file is public (it ships with the GitHub Pages site).
   Never put private details here: residential addresses, door codes,
   booking references, confirmation numbers or phone numbers.
   Private details live in the Travel Wallet, on your own device only.

   Status values:  "confirmed"  booked / fixed
                   "planned"    intended, not booked
                   "optional"   an idea, swap freely
   Times:  "start"/"end" are ISO timestamps with offsets and are only set
           when the time is actually known. "time" is the display label.
   ===================================================================== */
window.TRIP = (() => {
  const img = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

  const PHOTOS = {
    hero:     { id:'photo-1734828813095-29918ed39c8d', alt:'Gyeongbokgung Palace under snow', by:'Fili Santillán', page:'https://unsplash.com/photos/a-red-building-with-a-green-roof-in-the-snow-YSdVTGfZFPo' },
    gamcheon: { id:'photo-1672671187899-a10f547341f1', alt:'Colourful hillside houses of Gamcheon Culture Village', by:'Luke Ow', page:'https://unsplash.com/photos/a-large-group-of-colorful-houses-on-a-hill-mLKkqlqFiZ4' },
    yonggung: { id:'photo-1740785978879-506357754d72', alt:'Haedong Yonggungsa temple on the rocky coast', by:'Dmitry Voronov', page:'https://unsplash.com/photos/a-beautiful-temple-stands-by-the-rocky-coast-_s7lmHcNyDM' },
    ktx:      { id:'photo-1788572276239-7eb82f6ae47c', alt:'A KTX high-speed train arriving at Daejeon Station', by:'arcticworks', page:'https://unsplash.com/photos/ktx-high-speed-train-at-station-kpKQNOFHjSk' },
    palace:   { id:'photo-1734828813144-7ac7ad69120f', alt:'Snow-covered walkway at Gyeongbokgung Palace', by:'Fili Santillán', page:'https://unsplash.com/photos/a-snow-covered-walkway-next-to-a-building-KduitqdAcxo' },
    tower:    { id:'photo-1570191913384-7b4ff11716e7', alt:'N Seoul Tower above a stone wall on Namsan', by:'Robson Hatsukami Morgan', page:'https://unsplash.com/photos/namsan-tower-above-stone-wall-seoul-ku9Ftte6Ymo' },
    hanokSnow:{ id:'photo-1771411068337-dce562770ca7', alt:'Traditional Korean houses covered in snow', by:'Jeong yunji', page:'https://unsplash.com/photos/traditional-korean-houses-covered-in-snow-Ve5bLr_Abvg' },
    hanokFall:{ id:'photo-1771411068614-3e5e4a978a78', alt:'Snow falling on hanok houses with stone walls', by:'Jeong yunji', page:'https://unsplash.com/photos/snow-falling-on-traditional-korean-houses-with-stone-walls-C2BEKSEOXq8' },
    wing:     { id:'photo-1707277433239-e5b32d6f56bc', alt:'View of an aeroplane wing from the window, Incheon', by:'Olivllr Wang', page:'https://unsplash.com/photos/a-view-of-an-airplane-wing-from-a-window-uRHG_HSNzL4' },
    yeongdo:  { id:'photo-1776494395288-569caa8b1bbb', alt:'Yeongdo Bridge and the Busan waterfront at night', by:'JHANY BLUE', page:'https://unsplash.com/photos/night-view-of-a-city-with-illuminated-buildings-and-bridges-zJO7_NmOAXM' },
    hongdae:  { id:'photo-1694276971921-ff8f103752eb', alt:'A narrow alley near Hongik Univ. Station at night', by:'realfish', page:'https://unsplash.com/photos/a-narrow-alleyway-in-a-city-at-night-FvIBFE45uHw' }
  };

  // Approximate public coordinates, for the illustrated map only.
  const P = {
    SIN:      { en:'Singapore Changi Airport', ko:'싱가포르 창이공항', lat:1.3644, lon:103.9915, q:'Singapore Changi Airport' },
    PUS:      { en:'Gimhae International Airport', ko:'김해국제공항', lat:35.1795, lon:128.9382, q:'Gimhae International Airport' },
    lavalse:  { en:'Lavalse Hotel', ko:'라발스호텔', lat:35.0937, lon:129.0368, q:'Lavalse Hotel Busan', addr:'82 Bongnaenaru-ro, Yeongdo-gu, Busan 49033', koAddr:'부산 영도구 봉래나루로 82' },
    gamcheon: { en:'Gamcheon Culture Village', ko:'감천문화마을', lat:35.0975, lon:129.0106, q:'Gamcheon Culture Village' },
    jagalchi: { en:'Jagalchi Market', ko:'자갈치시장', lat:35.0966, lon:129.0306, q:'Jagalchi Market Busan' },
    biff:     { en:'BIFF Square', ko:'BIFF광장', lat:35.0985, lon:129.0273, q:'BIFF Square Busan' },
    gukje:    { en:'Gukje Market', ko:'국제시장', lat:35.1017, lon:129.0284, q:'Gukje Market Busan' },
    yonggung: { en:'Haedong Yonggungsa', ko:'해동용궁사', lat:35.1883, lon:129.2233, q:'Haedong Yonggungsa' },
    luge:     { en:'Skyline Luge Busan', ko:'스카이라인 루지 부산', lat:35.1967, lon:129.2153, q:'Skyline Luge Busan' },
    mipo:     { en:'Haeundae Blueline Park (Mipo)', ko:'해운대 블루라인파크 미포정거장', lat:35.1590, lon:129.1700, q:'Haeundae Blueline Park Mipo Station' },
    capsule:  { en:'Haeundae Sky Capsule', ko:'해운대 스카이캡슐', lat:35.1600, lon:129.1795, q:'Haeundae Sky Capsule' },
    centum:   { en:'Shinsegae Centum City', ko:'신세계 센텀시티', lat:35.1689, lon:129.1295, q:'Shinsegae Centum City' },
    busanStn: { en:'Busan Station', ko:'부산역', lat:35.1152, lon:129.0422, q:'Busan Station' },
    seoulStn: { en:'Seoul Station', ko:'서울역', lat:37.5547, lon:126.9707, q:'Seoul Station' },
    hongik:   { en:'Hongik Univ. Station', ko:'홍대입구역', lat:37.5572, lon:126.9245, q:'Hongik University Station Exit 7' },
    gbg:      { en:'Gyeongbokgung Palace', ko:'경복궁', lat:37.5796, lon:126.9770, q:'Gyeongbokgung Palace' },
    bukchon:  { en:'Bukchon Hanok Village', ko:'북촌한옥마을', lat:37.5826, lon:126.9830, q:'Bukchon Hanok Village' },
    insadong: { en:'Insadong', ko:'인사동', lat:37.5740, lon:126.9850, q:'Insadong' },
    gwangjang:{ en:'Gwangjang Market', ko:'광장시장', lat:37.5701, lon:126.9996, q:'Gwangjang Market' },
    seongsu:  { en:'Seongsu-dong', ko:'성수동', lat:37.5446, lon:127.0557, q:'Seongsu-dong Seoul' },
    myeongdong:{en:'Myeongdong', ko:'명동', lat:37.5636, lon:126.9850, q:'Myeongdong' },
    tower:    { en:'N Seoul Tower', ko:'N서울타워', lat:37.5512, lon:126.9882, q:'N Seoul Tower' },
    yeonnam:  { en:'Yeonnam-dong', ko:'연남동', lat:37.5620, lon:126.9250, q:'Yeonnam-dong Gyeongui Line Forest Park' },
    ikseon:   { en:'Ikseon-dong', ko:'익선동', lat:37.5743, lon:126.9897, q:'Ikseon-dong' },
    coex:     { en:'COEX & Starfield Library', ko:'별마당도서관', lat:37.5100, lon:127.0600, q:'Starfield Library COEX' },
    ICN:      { en:'Incheon Airport Terminal 1', ko:'인천국제공항 제1여객터미널', lat:37.4490, lon:126.4510, q:'Incheon International Airport Terminal 1' }
  };

  const flights = [
    { id:'out', code:'7C2642', airline:'Jeju Air', status:'confirmed',
      from:{ code:'SIN', city:'Singapore', airport:'Changi', terminal:'T4' },
      to:  { code:'PUS', city:'Busan', airport:'Gimhae International', terminal:'' },
      dep:'2027-01-16T00:25:00+08:00', arr:'2027-01-16T08:05:00+09:00', duration:'6h 40m' },
    { id:'home', code:'TW161', airline:'Trinity Airways', status:'confirmed',
      from:{ code:'ICN', city:'Seoul', airport:'Incheon', terminal:'T1' },
      to:  { code:'SIN', city:'Singapore', airport:'Changi', terminal:'T2' },
      dep:'2027-01-23T15:30:00+09:00', arr:'2027-01-23T21:25:00+08:00', duration:'6h 55m' }
  ];

  const ktx = {
    date:'2027-01-18', status:'planned', from:P.busanStn, to:P.seoulStn,
    duration:'About 2h 15m to 2h 45m, depending on the train',
    distance:'About 417 km by rail (Gyeongbu high-speed line)',
    booking:'Book seats ahead in the Korail app or on letskorail.com. Add the train number and time to your Wallet once booked.',
    then:'Then take the all-stop AREX two stops to Hongik Univ. (about 6 minutes).',
    via:[[35.1152,129.0422],[35.8794,128.6286],[36.3323,127.4342],[36.62,127.33],[37.2,127.05],[37.5547,126.9707]]
  };

  const stays = [
    { id:'lavalse', name:'Lavalse Hotel', city:'Busan', area:'Yeongdo-gu, by Yeongdo Bridge', status:'confirmed',
      place:P.lavalse, photo:PHOTOS.yeongdo, public:true,
      checkIn:'2027-01-16T15:00:00+09:00', checkOut:'2027-01-18T11:00:00+09:00', nights:2,
      room:'Ondol Ocean View, 3 futons (traditional heated floor)',
      amenities:['Rooftop terrace','Fitness centre','Breakfast restaurant','Sky café'],
      notes:['We land around 08:05, so ask the front desk to hold bags until check-in.','Nampo Station (Line 1) is about a 10–12 minute walk across Yeongdo Bridge.'] },
    { id:'hongdae', name:'Hongdae Airbnb', city:'Seoul', area:'Hongdae, Mapo-gu', status:'confirmed', public:false,
      place:{ ...P.hongik, en:'Near Hongik Univ. Station' }, photo:PHOTOS.hongdae,
      checkIn:null, checkOut:null, checkInDate:'2027-01-18', checkOutDate:'2027-01-23', nights:5,
      room:'Apartment (details in your Wallet)',
      amenities:[],
      notes:['Host: leave Hongik University Station by Exit 7, then about a 4-minute walk.','Take the all-stop AREX. The express train does not stop at Hongik Univ.'] }
  ];

  // ---- Itinerary: every entry from the original site, in original order ----
  const days = [
    { n:1, date:'2027-01-16', city:'Busan', title:'Touchdown', headline:'Red-eye in, straight to the hills',
      blurb:'Land at Gimhae in the morning, drop bags in Yeongdo, then the painted alleys of Gamcheon and seafood by the harbour.',
      photo:PHOTOS.gamcheon, sleep:'Lavalse Hotel', items:[
      { id:'d1-fly', time:'00:25', start:'2027-01-16T00:25:00+08:00', end:'2027-01-16T08:05:00+09:00', title:'Fly to Busan on Jeju Air 7C2642', desc:'Departs Changi Terminal 4. Get some sleep on board.', status:'confirmed', place:P.SIN, method:'flight', duration:'6h 40m' },
      { id:'d1-land', time:'08:05', start:'2027-01-16T08:05:00+09:00', title:'Land at Gimhae', desc:'Clear immigration, then buy a T-money card and get some won at a convenience store.', status:'confirmed', place:P.PUS },
      { id:'d1-train', time:'~09:00', title:'Train to the hotel', desc:'Busan–Gimhae Light Rail to Sasang, Line 2 to Seomyeon, then Line 1 to Nampo. Walk about 10–12 minutes over Yeongdo Bridge.', status:'planned', place:P.lavalse, method:'subway', duration:'About 1 hour by public transport', note:'Nampo exit needs checking on the day: one guide says Exit 6, another Exit 8.' },
      { id:'d1-bags', time:'~10:30', title:'Drop the bags at Lavalse', desc:'Check-in isn’t until 15:00, so ask the front desk to hold our luggage.', status:'planned', place:P.lavalse },
      { id:'d1-gamcheon', time:'Afternoon', title:'Gamcheon Culture Village', desc:'Pastel hillside houses, mural alleys and rooftop viewpoints.', status:'planned', place:P.gamcheon, method:'taxi or bus', note:'Check Naver Map for the live route from the hotel.' },
      { id:'d1-checkin', time:'15:00', start:'2027-01-16T15:00:00+09:00', title:'Check in at Lavalse Hotel', desc:'Ondol Ocean View room with 3 futons.', status:'confirmed', place:P.lavalse },
      { id:'d1-jagalchi', time:'Evening', title:'Jagalchi & Nampo-dong', desc:'Seafood at Jagalchi, then street snacks at BIFF Square and Gukje Market. Early night after the red-eye.', status:'planned', place:P.jagalchi }
    ]},
    { n:2, date:'2027-01-17', city:'Busan', title:'East coast run', headline:'Temple on the rocks, pods by the sea',
      blurb:'A full day on Busan’s east side: the seaside temple, the luge, the Sky Capsule along the coast, and a warm-up at Centum City.',
      photo:PHOTOS.yonggung, sleep:'Lavalse Hotel', items:[
      { id:'d2-temple', time:'Early', title:'Haedong Yonggungsa', desc:'The temple on the sea rocks. Get there early, before the tour buses.', status:'planned', place:P.yonggung },
      { id:'d2-luge', time:'Late morning', title:'Skyline Luge', desc:'Close by in Osiria. Get the multi-ride pass.', status:'planned', place:P.luge },
      { id:'d2-lunch', time:'Lunch', title:'Haeundae or Mipo', desc:'Somewhere near the beach.', status:'optional', place:P.mipo },
      { id:'d2-capsule', time:'Afternoon', title:'Haeundae Sky Capsule', desc:'Book a time slot ahead. Little pods ride along the coast between Mipo and Cheongsapo.', status:'planned', place:P.capsule, note:'Book a slot in advance.' },
      { id:'d2-centum', time:'Evening', title:'Shinsegae Centum City', desc:'The huge mall and food hall, plus Spa Land to thaw out. Then back to Yeongdo.', status:'planned', place:P.centum }
    ]},
    { n:3, date:'2027-01-18', city:'Busan → Seoul', title:'Fast train north', headline:'Busan to Seoul on the KTX',
      blurb:'Check out by 11:00, cross the country on the KTX, then two stops on the airport line to Hongdae.',
      photo:PHOTOS.ktx, sleep:'Hongdae Airbnb', items:[
      { id:'d3-out', time:'11:00', start:'2027-01-18T11:00:00+09:00', title:'Check out of Lavalse', desc:'Taxi to Busan Station, about a 10-minute drive.', status:'confirmed', place:P.lavalse, method:'taxi' },
      { id:'d3-ktx', time:'Midday', title:'KTX to Seoul Station', desc:'About 2h 15m to 2h 45m depending on the train. Add the train time once it’s booked.', status:'planned', place:P.busanStn, method:'ktx', todo:'Train time to add' },
      { id:'d3-arex', time:'Afternoon', title:'AREX to Hongdae', desc:'From Seoul Station, take the all-stop AREX 2 stops to Hongik Univ. (about 6 minutes). Leave by Exit 7, then walk about 4 minutes.', status:'planned', place:P.hongik, method:'subway' },
      { id:'d3-checkin', time:'TBC', title:'Check in at the Hongdae Airbnb', desc:'Check-in time and entry instructions to add (in your Wallet, not on the public site).', status:'confirmed', place:P.hongik, todo:'Time to add' },
      { id:'d3-night', time:'Evening', title:'Hongdae night', desc:'Buskers, Korean BBQ and late-night shopping.', status:'planned', place:P.hongik }
    ]},
    { n:4, date:'2027-01-19', city:'Seoul', title:'Palaces & old Seoul', headline:'Palace snow and hanok lanes',
      blurb:'An idea for the first full Seoul day: Gyeongbokgung, the lanes of Bukchon and Insadong, dinner at Gwangjang Market.',
      photo:PHOTOS.palace, sleep:'Hongdae Airbnb', items:[
      { id:'d4-gbg', time:'Morning', title:'Gyeongbokgung Palace', desc:'Rent a hanbok and you get in free.', status:'optional', place:P.gbg },
      { id:'d4-bukchon', time:'Afternoon', title:'Bukchon & Insadong', desc:'Old houses, tea and craft shops.', status:'optional', place:P.bukchon },
      { id:'d4-market', time:'Evening', title:'Gwangjang Market', desc:'Street-food heaven.', status:'optional', place:P.gwangjang }
    ]},
    { n:5, date:'2027-01-20', city:'Seoul', title:'Shop till you drop', headline:'Seongsu, Myeongdong and the city lights',
      blurb:'Pop-ups and cafés in Seongsu, skincare and street food in Myeongdong, then up Namsan for the view.',
      photo:PHOTOS.tower, sleep:'Hongdae Airbnb', items:[
      { id:'d5-seongsu', time:'Morning', title:'Seongsu', desc:'Pop-up stores and warehouse cafés.', status:'optional', place:P.seongsu },
      { id:'d5-myeongdong', time:'Afternoon', title:'Myeongdong', desc:'Skincare shopping and street food.', status:'optional', place:P.myeongdong },
      { id:'d5-tower', time:'Night', title:'N Seoul Tower', desc:'Cable car up for the city lights.', status:'optional', place:P.tower }
    ]},
    { n:6, date:'2027-01-21', city:'Seoul', title:'Day trip', headline:'Out of the city for a day',
      blurb:'Pick one: a snow day at a ski resort, Nami Island, or a DMZ tour (book ahead). Dinner back near home.',
      photo:PHOTOS.hanokSnow, sleep:'Hongdae Airbnb', items:[
      { id:'d6-trip', time:'All day', title:'Pick one', desc:'A snow day at a ski resort, Nami Island, or a DMZ tour (book ahead).', status:'optional', place:null },
      { id:'d6-yeonnam', time:'Evening', title:'Yeonnam-dong', desc:'Dinner a short walk from the Airbnb.', status:'optional', place:P.yeonnam }
    ]},
    { n:7, date:'2027-01-22', city:'Seoul', title:'Last full day', headline:'Brunch, books and a farewell dinner',
      blurb:'Hanok cafés in Ikseon-dong, the Starfield Library if it’s freezing, online check-in, and a last dinner.',
      photo:PHOTOS.hanokFall, sleep:'Hongdae Airbnb', items:[
      { id:'d7-ikseon', time:'Morning', title:'Ikseon-dong', desc:'Brunch in old-house cafés.', status:'optional', place:P.ikseon },
      { id:'d7-coex', time:'Afternoon', title:'COEX & Starfield Library', desc:'Indoors if it’s freezing. Last souvenirs.', status:'optional', place:P.coex },
      { id:'d7-checkin', time:'15:30', start:'2027-01-22T15:30:00+09:00', title:'Check in online for TW161', desc:'Online check-in usually opens 24 hours before departure. Do it while packing.', status:'planned', place:null },
      { id:'d7-dinner', time:'Night', title:'Farewell dinner', desc:'', status:'optional', place:null }
    ]},
    { n:8, date:'2027-01-23', city:'Seoul → Singapore', title:'Homeward', headline:'One last train, then home',
      blurb:'Check out, the all-stop AREX to Incheon, and the afternoon flight back to Changi.',
      photo:PHOTOS.wing, sleep:'Home', items:[
      { id:'d8-out', time:'Morning', title:'Check out of the Airbnb', desc:'Check-out time to add from the host.', status:'confirmed', place:P.hongik, todo:'Time to add' },
      { id:'d8-arex', time:'11:30', title:'AREX to Incheon T1', desc:'All-stop AREX from Hongik Univ., 50–60 minutes according to the host. The express doesn’t stop at Hongik.', status:'planned', place:P.ICN, method:'subway', duration:'50–60 min' },
      { id:'d8-airport', time:'12:30', start:'2027-01-23T12:30:00+09:00', title:'At Incheon Terminal 1', desc:'Counters usually close 1 hour before departure (14:30).', status:'planned', place:P.ICN },
      { id:'d8-fly', time:'15:30', start:'2027-01-23T15:30:00+09:00', end:'2027-01-23T21:25:00+08:00', title:'Fly home on TW161', desc:'Trinity Airways to Changi Terminal 2, landing at 21:25.', status:'confirmed', place:P.ICN, method:'flight', duration:'6h 55m' }
    ]}
  ];

  // Key times (check-in / check-out / online check-in), from the original site
  const keyTimes = [
    { when:'2027-01-15T00:25:00+08:00', day:'Fri 15 Jan', time:'00:25', tz:'SGT', title:'Jeju Air online check-in opens', note:'Usually opens 24 hours before departure. Buy extra baggage online before the flight; it’s cheaper than at the counter.', cal:true },
    { when:'2027-01-15T21:25:00+08:00', day:'Fri 15 Jan', time:'21:25', tz:'SGT', title:'Be at Changi Terminal 4', note:'The flight is just after midnight, so we leave on Friday night. Counters usually open 3 hours before and close 1 hour before.', cal:true, highlight:true },
    { when:'2027-01-16T00:25:00+08:00', day:'Sat 16 Jan', time:'00:25', tz:'SGT', title:'Fly SIN → PUS on 7C2642', note:'Lands at Gimhae at 08:05 Korea time.' },
    { when:'2027-01-16T15:00:00+09:00', day:'Sat 16 Jan', time:'15:00', tz:'KST', title:'Check in at Lavalse Hotel', note:'Bags can be dropped earlier.', cal:true },
    { when:'2027-01-18T11:00:00+09:00', day:'Mon 18 Jan', time:'11:00', tz:'KST', title:'Check out of Lavalse', note:'Then taxi to Busan Station for the KTX.', cal:true },
    { when:null, day:'Mon 18 Jan', time:'TBC', tz:'KST', title:'Check in at the Hongdae Airbnb', note:'Add the time in your Wallet.', stay:'hongdae', field:'checkIn' },
    { when:'2027-01-22T15:30:00+09:00', day:'Fri 22 Jan', time:'15:30', tz:'KST', title:'Trinity Airways online check-in opens', note:'Usually open from 24 hours to 1 hour before departure.', cal:true },
    { when:null, day:'Sat 23 Jan', time:'TBC', tz:'KST', title:'Check out of the Airbnb', note:'Add the time in your Wallet.', stay:'hongdae', field:'checkOut' },
    { when:'2027-01-23T12:30:00+09:00', day:'Sat 23 Jan', time:'12:30', tz:'KST', title:'Be at Incheon Terminal 1', note:'Leave Hongdae by about 11:30 on the all-stop AREX.', cal:true },
    { when:'2027-01-23T15:30:00+09:00', day:'Sat 23 Jan', time:'15:30', tz:'KST', title:'Fly ICN → SIN on TW161', note:'Lands at Changi T2 at 21:25.' }
  ];

  // Transport journeys. "verify" marks anything not confirmed by an official source.
  const journeys = [
    { id:'j-airport-hotel', day:1, from:'Gimhae Airport', to:'Lavalse Hotel', modes:['subway','walk'],
      lines:[{name:'BGL light rail', color:'#8652A1', note:'Gimhae Airport → Sasang'},{name:'Busan Line 2', color:'#81BF48', note:'Sasang → Seomyeon'},{name:'Busan Line 1', color:'#F06A00', note:'Seomyeon → Nampo'}],
      station:'Nampo Station (Line 1)', exit:'Exit 6 or 8', exitVerify:true, transfers:2, walk:'10–12 min across Yeongdo Bridge',
      duration:'About 1 hour', alt:'Taxi: about 35 minutes', place:P.lavalse,
      source:'Hotel guides (HaniSeoul, Hotels.com). Guides disagree on the Nampo exit; check the signs for Yeongdo Bridge.' },
    { id:'j-hotel-busanstn', day:3, from:'Lavalse Hotel', to:'Busan Station', modes:['taxi'],
      duration:'About 10 minutes by taxi', transfers:0, place:P.busanStn, source:'Hotels.com lists Busan Station as a 9-minute drive.' },
    { id:'j-ktx', day:3, from:'Busan Station', to:'Seoul Station', modes:['ktx'], lines:[{name:'KTX (Korail)', color:'#1F3E7A', note:'Gyeongbu high-speed line'}],
      duration:'About 2h 15m – 2h 45m', distance:'About 417 km', transfers:0, place:P.seoulStn, source:'Typical KTX timetable range; check your ticket.' },
    { id:'j-seoulstn-hongik', day:3, from:'Seoul Station', to:'Hongik Univ. Station', modes:['subway'],
      lines:[{name:'AREX all-stop', color:'#0090D2', note:'2 stops: Gongdeok, then Hongik Univ.'}],
      station:'Hongik Univ. Station', exit:'Exit 7', exitVerify:false, transfers:0, duration:'About 6 minutes', walk:'About 4 min to the flat (host)', place:P.hongik,
      source:'Exit and walk time from the Airbnb host. The AREX express does not stop at Hongik Univ.' },
    { id:'j-hongik-icn', day:8, from:'Hongik Univ. Station', to:'Incheon Airport T1', modes:['subway'],
      lines:[{name:'AREX all-stop', color:'#0090D2', note:'Towards Incheon Airport'}],
      transfers:0, duration:'50–60 minutes (host)', place:P.ICN, source:'Journey time from the Airbnb host.' }
  ];

  const subway = {
    seoul:[
      { line:'2', name:'Line 2', color:'#00A84D', stops:'Hongik Univ., Seongsu, Samseong (COEX)', note:'Circle line through Hongdae' },
      { line:'A', name:'AREX', color:'#0090D2', stops:'Incheon Airport, Hongik Univ., Gongdeok, Seoul Station', note:'Take the all-stop train for Hongik' },
      { line:'3', name:'Line 3', color:'#EF7C1C', stops:'Gyeongbokgung, Anguk (Bukchon), Jongno 3-ga', note:'Palaces and old Seoul' },
      { line:'4', name:'Line 4', color:'#00A5DE', stops:'Seoul Station, Myeongdong', note:'Myeongdong and Namsan' },
      { line:'1', name:'Line 1', color:'#0052A4', stops:'Seoul Station, Jongno 3-ga', note:'Downtown' },
      { line:'5', name:'Line 5', color:'#996CAC', stops:'Jongno 3-ga, Gongdeok', note:'Ikseon-dong is near Jongno 3-ga' }
    ],
    busan:[
      { line:'1', name:'Busan Line 1', color:'#F06A00', stops:'Nampo, Jagalchi, Busan Station, Seomyeon', note:'Our hotel side of town' },
      { line:'2', name:'Busan Line 2', color:'#81BF48', stops:'Sasang, Seomyeon, Centum City, Haeundae', note:'East to Haeundae' },
      { line:'B', name:'BGL light rail', color:'#8652A1', stops:'Gimhae Airport, Sasang', note:'Airport link' }
    ]
  };

  const tips = [
    { icon:'card', title:'T-money card', text:'Tap in and out on subways and buses in both cities. Buy and top up with cash at convenience stores.' },
    { icon:'map', title:'Naver Map or KakaoMap', text:'Google Maps doesn’t give full walking or driving directions in Korea. Use Naver or Kakao for routes.' },
    { icon:'car', title:'Kakao T for taxis', text:'Korea’s main taxi app. Show drivers the Korean address or place name.' },
    { icon:'train', title:'AREX: all-stop vs express', text:'Only the all-stop AREX stops at Hongik Univ. The express runs non-stop between Seoul Station and Incheon.' },
    { icon:'translate', title:'Papago', text:'Point your camera at menus and signs to translate them.' }
  ];

  const emergency = {
    numbers:[
      { label:'Police', num:'112', tel:'112' },
      { label:'Fire & ambulance', num:'119', tel:'119' },
      { label:'Korea Travel Hotline (24h, English)', num:'1330', tel:'1330', alt:'+82-2-1330 from a foreign number' }
    ],
    embassy:{
      name:'Embassy of the Republic of Singapore, Seoul',
      address:'28th Fl., Seoul Finance Center, 136 Sejong-daero, Jung-gu, Seoul 04520',
      phone:'+82-2-774-2464', phoneLocal:'02-774-2464 / 2465',
      duty:'+82-10-7204-6240', dutyLocal:'010-7204-6240',
      email:'singemb_seo@mfa.sg',
      hours:'Consular services Mon–Fri, 10:00–12:00 and 14:00–16:00, by appointment',
      source:'https://seoul.mfa.gov.sg/consular-services/information-for-travellers-to-the-rok/'
    },
    passport:[
      'Report the loss to ICA online with Singpass (ica.gov.sg, lost passport e-service).',
      'Apply online for a Document of Identity (DOI), a one-way travel document back to Singapore, and choose collection at the Embassy in Seoul.',
      'If the passport was stolen or lost through a crime, you may also report it to the local police (112).',
      'If you can’t do it online, call the Embassy during office hours on +82-2-774-2464 or email singemb_seo@mfa.sg.'
    ],
    passportSource:'https://seoul.mfa.gov.sg/consular-services/loss-of-singapore-passport/',
    phrases:[
      ['Hello','안녕하세요','annyeonghaseyo'],['Thank you','감사합니다','kamsahamnida'],['This one, please','이거 주세요','igeo juseyo'],
      ['How much is it?','얼마예요?','eolmayeyo?'],['Where is the toilet?','화장실 어디예요?','hwajangsil eodiyeyo?'],
      ['Please take me here','여기로 가 주세요','yeogiro ga juseyo'],['Help!','도와주세요!','dowajuseyo!'],['I lost my passport','여권을 잃어버렸어요','yeogwoneul ireobeoryeosseoyo']
    ]
  };

  // Default packing list. Names marked * existed on the original site (ticks carry over).
  const packing = [
    ['Documents','Passport, valid 6+ months'],['Documents','Both flight bookings'],['Documents','Lavalse confirmation'],['Documents','Airbnb check-in instructions'],
    ['Documents','KTX tickets'],['Documents','Travel insurance'],['Documents','Korea entry requirements checked (K-ETA, arrival card)'],
    ['Clothing','Thermals, 3 sets',3],['Clothing','Long padded coat'],['Clothing','2–3 sweaters or fleeces',2],['Clothing','Beanie, scarf, gloves'],
    ['Clothing','Wool socks',5],['Clothing','Waterproof walking shoes'],['Clothing','Swimwear, for Spa Land'],
    ['Toiletries','Thick moisturiser & lip balm'],['Toiletries','Hand cream'],['Toiletries','Toothbrush & toiletries'],['Toiletries','Personal medication'],
    ['Electronics','Power bank, in cabin bag'],['Electronics','Plug adapter, type C/F'],['Electronics','Charging cables'],['Electronics','eSIM or data plan'],
    ['Travel essentials','Hand warmers'],['Travel essentials','Foldable shopping tote'],['Travel essentials','Some won in cash'],['Travel essentials','Small umbrella'],
    ['Miscellaneous','Eye mask & earplugs for the red-eye'],['Miscellaneous','Snacks for the flight']
  ];
  // The original site's lists, in order, so saved ticks can be carried over.
  const legacyPacking = {
    docs:['Passport, valid 6+ months','Both flight bookings','Lavalse confirmation','Airbnb check-in instructions','KTX tickets','Travel insurance','Korea entry requirements checked (K-ETA, arrival card)'],
    clothes:['Thermals, 3 sets','Long padded coat','2–3 sweaters or fleeces','Beanie, scarf, gloves','Wool socks','Waterproof walking shoes','Swimwear, for Spa Land'],
    gear:['Power bank, in cabin bag','Plug adapter, type C/F','eSIM or data plan','Thick moisturiser & lip balm','Hand warmers','Foldable shopping tote','Some won in cash']
  };

  return {
    title:'Korea, 2027', start:'2027-01-16', end:'2027-01-23', tz:'Asia/Seoul',
    departure:'2027-01-16T00:25:00+08:00', homecoming:'2027-01-23T21:25:00+08:00',
    cities:{ busan:{ name:'Busan', lat:35.1796, lon:129.0756, from:'2027-01-16', to:'2027-01-18' }, seoul:{ name:'Seoul', lat:37.5665, lon:126.9780, from:'2027-01-18', to:'2027-01-23' } },
    img, PHOTOS, P, flights, ktx, stays, days, keyTimes, journeys, subway, tips, emergency, packing, legacyPacking
  };
})();
