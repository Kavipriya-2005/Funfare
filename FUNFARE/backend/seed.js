const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Activity = require('./models/Activity');

const activities = [
  {
    name: 'Marina Beach Morning Walk',
    description: 'A peaceful stroll along the shore with sunrise views and sea breeze.',
    type: 'Outdoor',
    category: 'outdoor',
    image: 'https://indiano.travel/wp-content/uploads/2022/04/Sunrise-on-beach-with-dramatic-sky.-Marina-beach-Chennai-India.jpg',
    images: [
      'https://indiano.travel/wp-content/uploads/2022/04/Sunrise-on-beach-with-dramatic-sky.-Marina-beach-Chennai-India.jpg',
      'https://t4.ftcdn.net/jpg/04/84/47/27/360_F_484472702_acpl3SZTBwb2Al4ZiW8VusICp7Utl8ed.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLUB0kANQ7dDZEWUykiAT3Jo0cWs-QAARxVFOuxJGpTRCORcyT8sOeWDQ&s',
    ],
    reviews: [
      { user: 'Aisha', rating: 5, comment: 'Best sunrise walk in Chennai with calm waves and fresh air.' },
      { user: 'Ravi', rating: 4, comment: 'Great spot for morning exercise and photography.' },
      { user: 'Priya', rating: 5, comment: 'Clean beach edge and friendly local vendors nearby.' },
    ],
    price: 0,
    rating: 4.8,
    reviewCount: 320,
    ageGroup: 'All ages',
    distance: 1.2,
    locationText: 'Marina Beach, Chennai',
    latitude: 13.0489,
    longitude: 80.2820,
    bookingAvailable: false,
  },
  {
    name: 'Government Museum Visit',
    description: 'Explore art, history and science exhibits from the region with guided displays.',
    type: 'Museum',
    category: 'museum',
    image: 'https://chennaitourism.travel/images/places-to-visit/headers/chennai-government-museum-tourism-entry-fee-timings-holidays-reviews-header.jpg',
    images: [
      'https://chennaitourism.travel/images/places-to-visit/headers/chennai-government-museum-tourism-entry-fee-timings-holidays-reviews-header.jpg',
      'https://s7ap1.scene7.com/is/image/incredibleindia/government-museum-chennai-tamil-nadu-4-attr-hero?qlt=82&ts=1726655081174',
      'https://imgstaticcontent.lbb.in/lbbnew/wp-content/uploads/2018/03/07222202/TheGovermentMuseum4.jpg',
    ],
    reviews: [
      { user: 'Neha', rating: 5, comment: 'Amazing collection and well-preserved galleries.' },
      { user: 'Sandeep', rating: 4, comment: 'A cultural gem with lots to learn about Chennai.' },
      { user: 'Maya', rating: 5, comment: 'Perfect indoor activity for rainy days and families.' },
    ],
    price: 23,
    rating: 4.9,
    reviewCount: 1500,
    ageGroup: 'All ages',
    distance: 2.1,
    locationText: 'Government Museum, Chennai',
    latitude: 13.0731,
    longitude: 80.2568,
    bookingAvailable: true,
  },
  {
    name: 'Adyar River Kayaking',
    description: 'Weekend kayaking for beginners and families on calm river stretches.',
    type: 'Outdoor',
    category: 'outdoor',
    image: 'https://media.assettype.com/thenewsminute%2Fimport%2Fsites%2Fdefault%2Ffiles%2FAdyarEcopark_1200.jpg',
    images: [
      'https://media.assettype.com/thenewsminute%2Fimport%2Fsites%2Fdefault%2Ffiles%2FAdyarEcopark_1200.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGRiipgsG4kjC2bumtxqaBI7wwdRdalg0BTw&s',
      'https://iasgyan.sgp1.digitaloceanspaces.com/images/Adyar_River.png',
    ],
    reviews: [
      { user: 'Karthik', rating: 5, comment: 'Fantastic outdoor adventure with a reliable guide.' },
      { user: 'Leela', rating: 4, comment: 'Fun and safe experience for beginners.' },
      { user: 'Naina', rating: 4, comment: 'Great way to enjoy the river and see birds.' },
    ],
    price: 35,
    rating: 4.6,
    reviewCount: 98,
    ageGroup: 'Adults',
    distance: 3.5,
    locationText: 'Adyar River, Chennai',
    latitude: 13.0059,
    longitude: 80.2644,
    bookingAvailable: true,
  },
  {
    name: 'Theosophical Gardens Walk',
    description: 'Beautiful gardens and peaceful walking paths through lush green grounds.',
    type: 'Outdoor',
    category: 'outdoor',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStQX6KNkgeOEXfvWub-_drPA5xDW8xBhZCcA&s',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStQX6KNkgeOEXfvWub-_drPA5xDW8xBhZCcA&s',
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/94/ab/15/the-pathway.jpg?w=900&h=500&s=1',
      'https://i0.wp.com/gokoulane.wordpress.com/wp-content/uploads/2014/07/11-copy.jpg?w=283&h=503&ssl=1',
    ],
    reviews: [
      { user: 'Vikram', rating: 5, comment: 'A tranquil garden escape right inside the city.' },
      { user: 'Sonia', rating: 5, comment: 'Beautiful flowers and lovely walking trails.' },
      { user: 'Anya', rating: 4, comment: 'Nice place to relax and enjoy a quiet afternoon.' },
    ],
    price: 15,
    rating: 4.7,
    reviewCount: 450,
    ageGroup: 'All ages',
    distance: 4.2,
    locationText: 'Theosophical Society, Chennai',
    latitude: 13.0149,
    longitude: 80.2794,
    bookingAvailable: true,
  },
  {
    name: 'Pondy Bazaar Art Walk',
    description: 'Self-guided tour of local art, galleries, and street markets.',
    type: 'Arts',
    category: 'arts',
    image: 'https://imgstaticcontent.lbb.in/lbbnew/wp-content/uploads/2017/09/24211023/PondyBazaar1-600x400.jpg',
    images: [
      'https://imgstaticcontent.lbb.in/lbbnew/wp-content/uploads/2017/09/24211023/PondyBazaar1-600x400.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQvR7D1EU2KZAaRwDQlHERe0SYvRh64nnQLA&s',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRECS6HuLQnIV0nNJ_hcpQ2pv2RMfQ1kRGXVg&s',
    ],
    reviews: [
      { user: 'Deepa', rating: 4, comment: 'Colorful market streets and creative art stalls.' },
      { user: 'Ramesh', rating: 4, comment: 'Nice walk with lots of local flavor and artwork.' },
      { user: 'Shweta', rating: 5, comment: 'Great place to find unique souvenirs and prints.' },
    ],
    price: 0,
    rating: 4.5,
    reviewCount: 210,
    ageGroup: 'Adults',
    distance: 2.8,
    locationText: 'Pondy Bazaar, Chennai',
    latitude: 13.0629,
    longitude: 80.2510,
    bookingAvailable: false,
  },
  {
    name: 'Kapaleeshwarar Temple Tour',
    description: 'Explore the famous temple with its colorful gopuram and cultural streets.',
    type: 'Outdoor',
    category: 'arts',
    image: 'https://www.tamilnadutourism.com/images/chennai/card/kapaleeshwarar-temple.webp',
    images: [
      'https://www.tamilnadutourism.com/images/chennai/card/kapaleeshwarar-temple.webp',
      'https://www.mrpilot.in/blog/wp-content/uploads/2020/01/Kapaleeshwarar-Temple-Chennai.jpg',
      'https://s7ap1.scene7.com/is/image/incredibleindia/kapaleeswarar-temple-chennai2-attr-hero?qlt=82&ts=1726654983477',
    ],
    reviews: [
      { user: 'Arun', rating: 5, comment: 'Mesmerizing architecture and peaceful temple atmosphere.' },
      { user: 'Meera', rating: 5, comment: 'A must-see cultural visit with beautiful carvings.' },
      { user: 'Nikhil', rating: 4, comment: 'Great guided tour and nearby food options.' },
    ],
    price: 10,
    rating: 4.7,
    reviewCount: 540,
    ageGroup: 'All ages',
    distance: 1.9,
    locationText: 'Kapaleeshwarar Temple, Mylapore',
    latitude: 13.0358,
    longitude: 80.2718,
    bookingAvailable: true,
  },
  {
    name: 'Elliot’s Beach Sunset Picnic',
    description: 'Relax with a sunset picnic on the sand and listen to gentle waves.',
    type: 'Outdoor',
    category: 'family',
    image: 'https://backpackersunited.in/_next/image?url=https%3A%2F%2Fbpu-images-v1.s3.eu-north-1.amazonaws.com%2Fuploads%2F1721741425283_Elliot%27s%20Beach%20CV%20.jpg&w=1920&q=75',
    images: [
      'https://backpackersunited.in/_next/image?url=https%3A%2F%2Fbpu-images-v1.s3.eu-north-1.amazonaws.com%2Fuploads%2F1721741425283_Elliot%27s%20Beach%20CV%20.jpg&w=1920&q=75',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSu9kFna28D-wEdt2ByfzWKER6WFSg4v2V_0Q&s',
      'https://i0.wp.com/www.inditrip.in/wp-content/uploads/2019/03/elliot-beaches-1.jpg?resize=1024%2C768&ssl=1',
    ],
    reviews: [
      { user: 'Tanvi', rating: 5, comment: 'Beautiful sunset views and relaxing beach vibe.' },
      { user: 'Kiran', rating: 4, comment: 'Lovely picnic spot with safe walking paths.' },
      { user: 'Sahil', rating: 5, comment: 'Great for evening hangouts with friends.' },
    ],
    price: 0,
    rating: 4.8,
    reviewCount: 430,
    ageGroup: 'All ages',
    distance: 2.4,
    locationText: 'Elliot’s Beach, Chennai',
    latitude: 13.0210,
    longitude: 80.2657,
    bookingAvailable: false,
  },
  {
    name: 'Chennai Rail Museum Visit',
    description: 'Discover vintage engines, train history and interactive exhibits.',
    type: 'Museum',
    category: 'museum',
    image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/c1/6e/93/the-new-selfie-wall-at.jpg?w=1200&h=-1&s=1',
    images: [
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/c1/6e/93/the-new-selfie-wall-at.jpg?w=1200&h=-1&s=1',
      'https://chennaitourism.travel/images/places-to-visit/headers/chennai-rail-museum-header.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStvACDRj3CBdkuo0V01L0HwU1701Vp-aM3GA&s',
    ],
    reviews: [
      { user: 'Rohit', rating: 4, comment: 'Great museum for train lovers and kids.' },
      { user: 'Nisha', rating: 5, comment: 'Fun exhibits and well-maintained locomotives.' },
      { user: 'Aarti', rating: 4, comment: 'Good collection, though a little crowded on weekends.' },
    ],
    price: 12,
    rating: 4.6,
    reviewCount: 310,
    ageGroup: 'All ages',
    distance: 3.1,
    locationText: 'Chennai Rail Museum, Perambur',
    latitude: 13.1085,
    longitude: 80.2179,
    bookingAvailable: true,
  },
  {
    name: 'Express Avenue Food Trail',
    description: 'Sample local street food and cafe bites in the lively mall area.',
    type: 'Food',
    category: 'food',
    image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0c/91/c3/38/inside-view-ea-mall.jpg?w=1200&h=-1&s=1',
    images: [
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0c/91/c3/38/inside-view-ea-mall.jpg?w=1200&h=-1&s=1',
      'https://content.jdmagicbox.com/comp/def_content/food-court/02208331ef-food-court-4-rucet.jpg',
      'https://media-cdn.tripadvisor.com/media/photo-s/15/91/41/32/food-court.jpg',
    ],
    reviews: [
      { user: 'Mohan', rating: 5, comment: 'Excellent food selection and helpful vendors.' },
      { user: 'Geeta', rating: 4, comment: 'Tasty snacks and a lively atmosphere.' },
      { user: 'Isha', rating: 4, comment: 'Good place to try many dishes in one walk.' },
    ],
    price: 20,
    rating: 4.4,
    reviewCount: 270,
    ageGroup: 'Adults',
    distance: 2.6,
    locationText: 'Express Avenue, Chennai',
    latitude: 13.0622,
    longitude: 80.2516,
    bookingAvailable: true,
  },
  {
    name: 'Mylapore Heritage Walk',
    description: 'Experience heritage streets, temples and old Chennai charm.',
    type: 'Outdoor',
    category: 'family',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuWhj-EV5iqq8FEsNsHgmKY9KplkapHIOGbA&s',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuWhj-EV5iqq8FEsNsHgmKY9KplkapHIOGbA&s',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUVJydR7xDlqgFXL4EHk-1v73kewTIt5blOA&s',
      'https://pictures.trodly.com/image/activity/1862/size-885x420/mode-crop/5b6306517e0f2.jpg',
    ],
    reviews: [
      { user: 'Bhavya', rating: 5, comment: 'Lovely heritage walk with charming streets and temples.' },
      { user: 'Kavya', rating: 4, comment: 'Great history, perfect for families and seniors.' },
      { user: 'Sundar', rating: 4, comment: 'Nice cultural experience with friendly guides.' },
    ],
    price: 5,
    rating: 4.6,
    reviewCount: 180,
    ageGroup: 'All ages',
    distance: 2.0,
    locationText: 'Mylapore, Chennai',
    latitude: 13.0350,
    longitude: 80.2712,
    bookingAvailable: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await Activity.deleteMany({});
    console.log('Old activities cleared');

    await Activity.insertMany(activities);
    console.log(`✅ Seeded ${activities.length} activities with coordinates`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();