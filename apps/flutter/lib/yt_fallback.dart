import 'models.dart';

YtClip _c(String id, String title, String artist) => YtClip(
      videoId: id,
      title: title,
      artist: artist,
      cover: 'https://i.ytimg.com/vi/$id/hqdefault.jpg',
    );

final worldClips = <YtClip>[
  _c('GIDiI5kyBDQ', 'Kwaku the Traveller', 'Black Sherif'),
  _c('NPCC02SaJVg', 'Terminator', 'King Promise'),
  _c('421w1j87fEM', 'Last Last', 'Burna Boy'),
  _c('tQiNQL-FEgU', 'Free Mind', 'Tems'),
  _c('WvxADzZMkEI', 'Tanzania', 'Uncle Waffles'),
  _c('pRpeEdMmmQ0', 'Waka Waka', 'Shakira'),
  _c('4NRXx6U8ABQ', 'Blinding Lights', 'The Weeknd'),
  _c('OPf0YbXqDm0', 'Uptown Funk', 'Mark Ronson'),
  _c('uxpDa-c-4Mc', 'Hotline Bling', 'Drake'),
  _c('JGwWNGJdvx8', 'Shape of You', 'Ed Sheeran'),
  _c('YQHsXMglC9A', 'Hello', 'Adele'),
  _c('kJQP7kiw5Fk', 'Despacito', 'Luis Fonsi'),
  _c('9bZkp7q19f0', 'GANGNAM STYLE', 'PSY'),
  _c('gdZLi9oWNZg', 'Dynamite', 'BTS'),
  _c('WMweEpGlu_U', 'Butter', 'BTS'),
  _c('dyRsYk0LyA8', 'Lovesick Girls', 'BLACKPINK'),
  _c('x8VYWazR5mE', '夜に駆ける', 'YOASOBI'),
  _c('k2qgadSvNyU', 'New Rules', 'Dua Lipa'),
  _c('H5v3kku4y6Q', 'As It Was', 'Harry Styles'),
  _c('fKopy74weus', 'Thunder', 'Imagine Dragons'),
  _c('hT_nvWreIhg', 'Counting Stars', 'OneRepublic'),
  _c('RgKAFK5djSk', 'See You Again', 'Wiz Khalifa'),
  _c('j5-yKhDd64s', 'Not Afraid', 'Eminem'),
  _c('nfWlot6h_JM', 'Shake It Off', 'Taylor Swift'),
];

const catalogCountries = [
  ('GH', 'Ghana'),
  ('NG', 'Nigeria'),
  ('ZA', 'South Africa'),
  ('KE', 'Kenya'),
  ('JM', 'Jamaica'),
  ('US', 'United States'),
  ('GB', 'United Kingdom'),
  ('BR', 'Brazil'),
  ('MX', 'Mexico'),
  ('KR', 'Korea'),
  ('JP', 'Japan'),
  ('IN', 'India'),
  ('FR', 'France'),
  ('PT', 'Portugal'),
];

const catalogGenres = [
  'Afrobeats',
  'Amapiano',
  'Highlife',
  'Hip hop',
  'R&B',
  'Pop',
  'Dancehall',
  'Gospel',
  'K-pop',
  'Latin',
  'Drill',
  'House',
];
