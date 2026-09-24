/**
 * India Marker Map Data (Flourish v13.0.1 Style)
 * Features major Indian metropolitan hubs, state capitals, iconic heritage photo spots,
 * and scenic aerial video tours.
 */

const INDIA_MARKERS_DATA = [
  // --- Photo Markers (Iconic Heritage Landmarks & Monuments) ---
  {
    id: "agra_taj_mahal",
    city: "Agra (Taj Mahal)",
    country: "Uttar Pradesh, India",
    type: "photo",
    lat: 27.1751,
    lng: 78.0421,
    category: "UNESCO World Wonder",
    population: "1.76 Million",
    description: "Home to the Taj Mahal, an ivory-white marble mausoleum on the Yamuna river, celebrated globally as the jewel of Muslim art in India.",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "delhi_india_gate",
    city: "New Delhi",
    country: "National Capital Territory, India",
    type: "photo",
    lat: 28.6139,
    lng: 77.2090,
    category: "National Capital",
    population: "32.9 Million (NCR)",
    description: "The capital of India, blending historic Mughal monuments like the Red Fort and Humayun's Tomb with Lutyens' grand avenues.",
    imageUrl: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "mumbai_gateway",
    city: "Mumbai",
    country: "Maharashtra, India",
    type: "photo",
    lat: 18.9220,
    lng: 72.8347,
    category: "Financial Capital",
    population: "20.9 Million",
    description: "Financial powerhouse of India, home to Bollywood, the Gateway of India, Marine Drive, and the Bombay Stock Exchange.",
    imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "jaipur_hawa_mahal",
    city: "Jaipur",
    country: "Rajasthan, India",
    type: "photo",
    lat: 26.9239,
    lng: 75.8267,
    category: "Heritage Pink City",
    population: "3.1 Million",
    description: "Capital of Rajasthan, famous for its terracotta-pink palace facades, Amber Fort, and the intricate honeycomb Hawa Mahal.",
    imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "amritsar_golden_temple",
    city: "Amritsar",
    country: "Punjab, India",
    type: "photo",
    lat: 31.6200,
    lng: 74.8765,
    category: "Spiritual Landmark",
    population: "1.13 Million",
    description: "The spiritual center of Sikhism, housing the Harmandir Sahib (Golden Temple) surrounded by the sacred Amrit Sarovar tank.",
    imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "kolkata_victoria",
    city: "Kolkata",
    country: "West Bengal, India",
    type: "photo",
    lat: 22.5448,
    lng: 88.3426,
    category: "Cultural Capital",
    population: "14.9 Million",
    description: "The City of Joy, renowned for colonial architecture like the Victoria Memorial, the Howrah Bridge, and a rich literary legacy.",
    imageUrl: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "srinagar_dal_lake",
    city: "Srinagar",
    country: "Jammu & Kashmir, India",
    type: "photo",
    lat: 34.0837,
    lng: 74.7973,
    category: "Scenic Paradise",
    population: "1.27 Million",
    description: "Summer capital situated in the Kashmir Valley, famed for traditional wooden houseboats on Dal Lake and Mughal terraced gardens.",
    imageUrl: "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=400&q=80"
  },

  // --- Video Markers (Scenic & Aerial Video Tours) ---
  {
    id: "mumbai_sealink_video",
    city: "Bandra-Worli Sea Link",
    country: "Mumbai, Maharashtra",
    type: "video",
    lat: 19.0330,
    lng: 72.8170,
    category: "Video Tour",
    population: "8-Lane Cable-Stayed Bridge",
    description: "Breathtaking aerial flyover above the Arabian Sea along the modern architectural marvel of the Bandra-Worli Sea Link.",
    videoTitle: "Mumbai Coastal Expressway Aerial Flyover"
  },
  {
    id: "varanasi_ghats_video",
    city: "Varanasi Ghats",
    country: "Uttar Pradesh, India",
    type: "video",
    lat: 25.3050,
    lng: 83.0100,
    category: "Video Tour",
    population: "Oldest Living City",
    description: "Atmospheric dawn drone journey over the sacred river Ganges and historic stone riverfront ghats.",
    videoTitle: "Ganges Sunrise Drone Journey"
  },
  {
    id: "kerala_backwaters_video",
    city: "Kerala Backwaters",
    country: "Alleppey / Kochi, Kerala",
    type: "video",
    lat: 9.4981,
    lng: 76.3388,
    category: "Video Tour",
    population: "Labyrinthine Lagoons",
    description: "Peaceful aerial cruise over coconut groves and traditional Kettuvallam houseboats gliding across tranquil canals.",
    videoTitle: "God's Own Country Lagoon Cruise"
  },
  {
    id: "goa_coast_video",
    city: "Goa Coastline",
    country: "Goa, India",
    type: "video",
    lat: 15.4989,
    lng: 73.8278,
    category: "Video Tour",
    population: "Tropical Beach Haven",
    description: "Sweeping coastline vistas over golden sand beaches, historic Portuguese forts, and palm-fringed estuaries.",
    videoTitle: "Goa Sunset Coastal Flyover"
  },
  {
    id: "ladakh_pass_video",
    city: "Ladakh Mountain Passes",
    country: "Ladakh, India",
    type: "video",
    lat: 34.1526,
    lng: 77.5771,
    category: "Video Tour",
    population: "High Altitude Wilderness",
    description: "High-altitude expedition over rugged Himalayan mountain passes, crystal-blue Pangong Lake, and Buddhist monasteries.",
    videoTitle: "Himalayan High Altitude Expedition"
  },

  // --- Building Markers (State Capitals, Tech Hubs & Metros) ---
  {
    id: "gurgaon",
    city: "Gurgaon (Gurugram)",
    country: "Haryana, India",
    type: "building",
    lat: 28.4595,
    lng: 77.0266,
    category: "Major IT & MNC Hub",
    population: "1.15 Million",
    description: "Millennium City of India, powerhouse of Fortune 500 headquarters, CyberHub, and rapid urban infrastructure."
  },
  {
    id: "bengaluru",
    city: "Bengaluru",
    country: "Karnataka, India",
    type: "building",
    lat: 12.9716,
    lng: 77.5946,
    category: "Silicon Valley of India",
    population: "12.3 Million",
    description: "India's premier high-tech and startup capital, housing top research centers, Electronic City, and lush botanical gardens."
  },
  {
    id: "hyderabad",
    city: "Hyderabad",
    country: "Telangana, India",
    type: "building",
    lat: 17.3850,
    lng: 78.4867,
    category: "HITEC City & Pharma Hub",
    population: "10.5 Million",
    description: "City of Pearls, famous for the historic Charminar, world-leading HITEC City IT campuses, and Genome Valley."
  },
  {
    id: "chennai",
    city: "Chennai",
    country: "Tamil Nadu, India",
    type: "building",
    lat: 13.0827,
    lng: 80.2707,
    category: "Automobile & Software Hub",
    population: "11.2 Million",
    description: "Detroit of South Asia, cultural powerhouse with Bharatanatyam dance traditions, Marina Beach, and major ports."
  },
  {
    id: "pune",
    city: "Pune",
    country: "Maharashtra, India",
    type: "building",
    lat: 18.5204,
    lng: 73.8567,
    category: "Oxford of the East & Auto Hub",
    population: "6.6 Million",
    description: "Leading educational center and thriving tech hub with Hinjawadi Rajiv Gandhi Infotech Park and automotive industries."
  },
  {
    id: "ahmedabad",
    city: "Ahmedabad",
    country: "Gujarat, India",
    type: "building",
    lat: 23.0225,
    lng: 72.5714,
    category: "Commercial Mega-City",
    population: "8.4 Million",
    description: "UNESCO World Heritage City on the Sabarmati river, textile capital, and gateway to GIFT City international financial hub."
  },
  {
    id: "chandigarh",
    city: "Chandigarh",
    country: "Punjab / Haryana, India",
    type: "building",
    lat: 30.7333,
    lng: 76.7794,
    category: "Planned City Capital",
    population: "1.16 Million",
    description: "India's first planned modernist city designed by Le Corbusier, famous for Sukhna Lake and Rock Garden."
  },
  {
    id: "lucknow",
    city: "Lucknow",
    country: "Uttar Pradesh, India",
    type: "building",
    lat: 26.8467,
    lng: 80.9462,
    category: "State Capital & Heritage Hub",
    population: "3.76 Million",
    description: "City of Nawabs, celebrated for courtly etiquette, Chikankari embroidery, and the grand Bara Imambara."
  },
  {
    id: "bhopal",
    city: "Bhopal",
    country: "Madhya Pradesh, India",
    type: "building",
    lat: 23.2599,
    lng: 77.4126,
    category: "City of Lakes",
    population: "2.4 Million",
    description: "Capital of Madhya Pradesh, known for Upper Lake, green city planning, and nearby UNESCO Sanchi Stupa."
  },
  {
    id: "patna",
    city: "Patna",
    country: "Bihar, India",
    type: "building",
    lat: 25.5941,
    lng: 85.1376,
    category: "Historic Capital (Pataliputra)",
    population: "2.5 Million",
    description: "Ancient capital city on the southern banks of the Ganges, historic center of the Maurya and Gupta empires."
  },
  {
    id: "bhubaneswar",
    city: "Bhubaneswar",
    country: "Odisha, India",
    type: "building",
    lat: 20.2961,
    lng: 85.8245,
    category: "Temple City & Smart City",
    population: "1.1 Million",
    description: "Capital of Odisha, recognized for over 500 ancient Kalinga stone temples and thriving IT and sports hubs."
  },
  {
    id: "guwahati",
    city: "Guwahati",
    country: "Assam, India",
    type: "building",
    lat: 26.1445,
    lng: 91.7362,
    category: "Gateway to Northeast India",
    population: "1.11 Million",
    description: "Premier metropolitan city of Northeast India on the Brahmaputra River, famous for Kamakhya Temple."
  },
  {
    id: "thiruvananthapuram",
    city: "Thiruvananthapuram",
    country: "Kerala, India",
    type: "building",
    lat: 8.5241,
    lng: 76.9366,
    category: "State Capital & Space Hub",
    population: "1.02 Million",
    description: "Capital of Kerala, home to the historic Padmanabhaswamy Temple and Technopark, India's first tech park."
  },
  {
    id: "kochi",
    city: "Kochi",
    country: "Kerala, India",
    type: "building",
    lat: 9.9312,
    lng: 76.2673,
    category: "Queen of the Arabian Sea",
    population: "2.1 Million",
    description: "Historic port city with Chinese fishing nets, spice trading markets, and Infopark smart city."
  },
  {
    id: "shimla",
    city: "Shimla",
    country: "Himachal Pradesh, India",
    type: "building",
    lat: 31.1048,
    lng: 77.1734,
    category: "Himalayan Capital",
    population: "206,000",
    description: "Historic summer capital in the Himalayan foothills, terminal of the UNESCO Kalka-Shimla mountain railway."
  },
  {
    id: "dehradun",
    city: "Dehradun",
    country: "Uttarakhand, India",
    type: "building",
    lat: 30.3165,
    lng: 78.0322,
    category: "Doon Valley Capital",
    population: "800,000",
    description: "Capital of Uttarakhand in the Doon Valley, nestled between the Ganges and Yamuna rivers."
  },
  {
    id: "ranchi",
    city: "Ranchi",
    country: "Jharkhand, India",
    type: "building",
    lat: 23.3441,
    lng: 85.3096,
    category: "City of Waterfalls",
    population: "1.45 Million",
    description: "Capital of Jharkhand on the Chota Nagpur Plateau, known for picturesque waterfalls and mineral resources."
  },
  {
    id: "raipur",
    city: "Raipur",
    country: "Chhattisgarh, India",
    type: "building",
    lat: 21.2514,
    lng: 81.6296,
    category: "Central Industrial Hub",
    population: "1.4 Million",
    description: "Capital of Chhattisgarh, prominent steel and aluminum manufacturing hub with Nava Raipur smart city."
  },
  {
    id: "visakhapatnam",
    city: "Visakhapatnam (Vizag)",
    country: "Andhra Pradesh, India",
    type: "building",
    lat: 17.6868,
    lng: 83.2185,
    category: "City of Destiny & Naval Hub",
    population: "2.3 Million",
    description: "Major port city and industrial center situated along the Bay of Bengal, headquarters of Eastern Naval Command."
  },
  {
    id: "indore",
    city: "Indore",
    country: "Madhya Pradesh, India",
    type: "building",
    lat: 22.7196,
    lng: 75.8577,
    category: "Cleanest City in India",
    population: "3.2 Million",
    description: "Commercial capital of Central India, consistently ranked India's cleanest city, home to IIM and IIT."
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INDIA_MARKERS_DATA };
}
