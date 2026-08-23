import 'models.dart';

const mediaHost = String.fromEnvironment('HOST', defaultValue: '');
String media(String path) => '$mediaHost$path';

const artists = [
  Artist(slug: 'nia-adaeze', name: 'Nia Adaeze', avatar: '/artists/nia.jpg', city: 'Lagos', banner: '/banners/hero.jpg', followers: '402K'),
  Artist(slug: 'nova-park', name: 'Nova Park', avatar: '/artists/nova.jpg', city: 'Seoul', banner: '/covers/seoul-glass.jpg', followers: '188K'),
  Artist(slug: 'ama-serwaa', name: 'Ama Serwaa', avatar: '/artists/ama.jpg', city: 'Accra', banner: '/covers/gold-coast.jpg', followers: '96K'),
  Artist(slug: 'kofi-blade', name: 'Kofi Blade', avatar: '/artists/kofi.jpg', city: 'London', banner: '/covers/night-market.jpg', followers: '74K'),
  Artist(slug: 'lila-moyo', name: 'Lila Moyo', avatar: '/artists/lila.jpg', city: 'Johannesburg', banner: '/covers/jacaranda.jpg', followers: '121K'),
  Artist(slug: 'jade-rivers', name: 'Jade Rivers', avatar: '/artists/jade.jpg', city: 'LA', banner: '/covers/palm-shadow.jpg', followers: '55K'),
];

const tracks = [
  Track(id: 'trk_04', title: 'Rain on Marble', artist: 'Nia Adaeze', artistSlug: 'nia-adaeze', cover: '/covers/terrace-lights.jpg', audio: '/audio/t04.mp3', plays: 402100, genre: 'Afrobeats'),
  Track(id: 'trk_01', title: 'Gold Coast Evening', artist: 'Ama Serwaa', artistSlug: 'ama-serwaa', cover: '/covers/gold-coast.jpg', audio: '/audio/t01.mp3', plays: 184200, genre: 'Highlife'),
  Track(id: 'trk_07', title: 'Warehouse 04', artist: 'The Accra Wave', artistSlug: 'accra-wave', cover: '/covers/warehouse.jpg', audio: '/audio/t07.mp3', plays: 173000, genre: 'Amapiano'),
  Track(id: 'trk_10', title: 'Jacaranda', artist: 'Lila Moyo', artistSlug: 'lila-moyo', cover: '/covers/jacaranda.jpg', audio: '/audio/t10.mp3', plays: 210400, genre: 'Amapiano'),
  Track(id: 'trk_03', title: 'Night Market', artist: 'Kofi Blade', artistSlug: 'kofi-blade', cover: '/covers/night-market.jpg', audio: '/audio/t03.mp3', plays: 98000, genre: 'Hip Hop'),
  Track(id: 'trk_16', title: 'Glass Rain', artist: 'Nova Park', artistSlug: 'nova-park', cover: '/covers/seoul-glass.jpg', audio: '/audio/t01.mp3', plays: 388000, genre: 'Pop'),
  Track(id: 'trk_05', title: 'Terrace', artist: 'Nia Adaeze', artistSlug: 'nia-adaeze', cover: '/covers/terrace-lights.jpg', audio: '/audio/t05.mp3', plays: 255000, genre: 'Afrobeats'),
  Track(id: 'trk_11', title: 'Desk Light', artist: 'Ebo Darko', artistSlug: 'ebo-darko', cover: '/covers/desk-light.jpg', audio: '/audio/t11.mp3', plays: 45000, genre: 'Hip Hop'),
  Track(id: 'trk_08', title: 'Morning Mercy', artist: 'Sister Adwoa', artistSlug: 'sister-adwoa', cover: '/covers/morning-mercy.jpg', audio: '/audio/t08.mp3', plays: 91000, genre: 'Gospel'),
  Track(id: 'trk_06', title: 'Atlantic Wind', artist: 'Sefu Diallo', artistSlug: 'sefu-diallo', cover: '/covers/atlantic-wind.jpg', audio: '/audio/t06.mp3', plays: 64000, genre: 'Afro-fusion'),
];

const playlists = [
  Playlist(id: 'pl_ghana', title: 'Global 200', cover: '/covers/gold-coast.jpg', kind: 'charts', subtitle: 'This week'),
  Playlist(id: 'pl_afro', title: 'Afrobeats Now', cover: '/covers/terrace-lights.jpg', kind: 'editorial', subtitle: 'New + heavy'),
  Playlist(id: 'pl_sunday', title: 'Sunday Light', cover: '/covers/morning-mercy.jpg', kind: 'editorial', subtitle: 'Gospel & highlife'),
  Playlist(id: 'pl_piano', title: 'After Dark', cover: '/covers/warehouse.jpg', kind: 'editorial', subtitle: 'Amapiano'),
  Playlist(id: 'pl_hip', title: 'Hip Hop Desk', cover: '/covers/desk-light.jpg', kind: 'editorial', subtitle: 'Beats'),
];

const nights = [
  Night(id: 'evt_rooftop', title: 'Rooftop Session', poster: '/events/rooftop.jpg', place: 'Accra · Labone', when: 'Fri 9:00pm', price: 'GH₵ 80'),
  Night(id: 'evt_warehouse', title: 'Warehouse 04', poster: '/covers/warehouse.jpg', place: 'Lagos · Ikeja', when: 'Sat 10:00pm', price: '₦ 4,500'),
  Night(id: 'evt_gold', title: 'Gold Coast Evening', poster: '/covers/gold-coast.jpg', place: 'Cape Coast', when: 'Sun 6:00pm', price: 'GH₵ 40'),
];

const lives = [
  LiveShow(id: 'live_nia', title: 'Nia · Unplugged', poster: '/covers/terrace-lights.jpg', artist: 'Nia Adaeze', when: 'Tonight 8pm', price: 'GH₵ 25'),
  LiveShow(id: 'live_nova', title: 'Seoul Glass', poster: '/covers/seoul-glass.jpg', artist: 'Nova Park', when: 'Sat 3pm GMT', price: 'Free'),
];

const posts = [
  Post(id: 'p1', author: 'Nia Adaeze', avatar: '/artists/nia.jpg', body: 'Palm Shadow. Los Angeles does not owe you a sunset, but this one stayed.', image: '/covers/palm-shadow.jpg', likes: '733'),
  Post(id: 'p2', author: 'Ama Serwaa', avatar: '/artists/ama.jpg', body: 'Highlife files from the Gold Coast session. Mastering this week.', image: '/covers/gold-coast.jpg', likes: '412'),
  Post(id: 'p3', author: 'Kofi Blade', avatar: '/artists/kofi.jpg', body: 'Night Market drop. If you are in Accra Friday, come through.', image: '/covers/night-market.jpg', likes: '198'),
];

const stories = [
  Story(id: 'n1', title: 'Why Accra is booking rooms again', cover: '/covers/warehouse.jpg', tag: 'Scene'),
  Story(id: 'n2', title: 'Nia Adaeze’s terrace tapes', cover: '/covers/terrace-lights.jpg', tag: 'Interview'),
  Story(id: 'n3', title: 'Amapiano after dark', cover: '/covers/jacaranda.jpg', tag: 'Playlist'),
];

List<Track> byGenre(String g) => tracks.where((t) => t.genre == g).toList();
Artist? artistBySlug(String slug) {
  for (final a in artists) {
    if (a.slug == slug) return a;
  }
  return null;
}
Track trackById(String id) => tracks.firstWhere((t) => t.id == id, orElse: () => tracks.first);
Night nightById(String id) => nights.firstWhere((e) => e.id == id, orElse: () => nights.first);
LiveShow liveById(String id) => lives.firstWhere((e) => e.id == id, orElse: () => lives.first);
