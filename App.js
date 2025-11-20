import React, { useState, useEffect, useCallback } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Image, 
  StatusBar, 
  Alert, 
  Keyboard,
  Platform,
  Dimensions,
} from "react-native";

// Constants 
const API_KEY = "YOUR_API_KEY_HERE"; // Replace with your OpenWeatherMap API key
const WEATHER_ICON_BASE_URL = "https://openweathermap.org/img/wn/";
const { width } = Dimensions.get('window');

// --- Helper Components ---

// Component for displaying individual weather details (e.g., Humidity, Wind)
const WeatherDetail = ({ icon, label, value }) => (
  <View style={detailStyles.detailContainer}>
    <Text style={detailStyles.detailIcon}>{icon}</Text>
    <Text style={detailStyles.detailLabel}>{label}</Text>
    <Text style={detailStyles.detailValue}>{value}</Text>
  </View>
);

// Component for the 5-Day Forecast horizontal list
const ForecastList = ({ forecast }) => (
  <View style={forecastStyles.container}>
    <Text style={forecastStyles.title}>5-Day Outlook</Text>
    <ScrollView 
      horizontal={true} 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={forecastStyles.scrollContainer}
    >
      {forecast.map((day, index) => (
        <View key={index} style={forecastStyles.card}>
          <Text style={forecastStyles.date}>{day.date}</Text>
          <Image
            source={{ uri: `${WEATHER_ICON_BASE_URL}${day.icon}@2x.png` }}
            style={forecastStyles.icon}
          />
          <Text style={forecastStyles.temp}>{day.temp}°</Text>
          <Text style={forecastStyles.desc}>{day.description}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

// --- Main App Component ---

export default function App() {
  const [city, setCity] = useState("Pristina"); 
  const [inputCity, setInputCity] = useState("Pristina"); 
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Set the primary accent color for the whole app
  const PRIMARY_COLOR = "#2a9d8f"; 

  // Function to fetch all weather data for a given city
  const fetchData = useCallback(async (cityName) => {
    if (!cityName.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setWeather(null); 
    setForecast([]); 

    try {
      // 1. Fetch Current Weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`;
      const weatherResponse = await fetch(weatherUrl);

      if (!weatherResponse.ok) {
        throw new Error("City not found. Please check the spelling.");
      }

      const weatherData = await weatherResponse.json();
      setWeather(weatherData);

      // 2. Fetch 5-Day Forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`;
      const forecastResponse = await fetch(forecastUrl);

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        
        // Extract forecast for noon (12:00:00)
        const dailyForecast = forecastData.list
          .filter(item => item.dt_txt.includes("12:00:00"))
          .slice(0, 5) // Ensure we only take 5 days
          .map(item => ({
            date: new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: 'short' }),
            temp: Math.round(item.main.temp), 
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          }));
        setForecast(dailyForecast);
      }
      
      setCity(cityName); 
      setInputCity(cityName); 

    } catch (err) {
      console.error("Error fetching weather:", err.message);
      setError(err.message);
      setInputCity(city); 
      Alert.alert("Search Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [city]); 

  // Initial load effect
  useEffect(() => {
    fetchData(city);
  }, [fetchData]);

  // Handle manual search
  const handleSearch = () => {
    fetchData(inputCity);
  };

  // --- Render Current Weather ---
  const renderCurrentWeather = () => {
    if (!weather) return null;

    const iconCode = weather.weather[0].icon;
    const iconUrl = `${WEATHER_ICON_BASE_URL}${iconCode}@4x.png`;
    const tempRounded = Math.round(weather.main.temp);

    return (
      <View style={mainStyles.currentWeatherContainer}>
        {/* Location Header */}
        <Text style={mainStyles.cityName}>
          {weather.name}, {weather.sys.country}
        </Text>
        <Text style={mainStyles.dateText}>
          Today's Weather
        </Text>

        {/* Main Temperature and Icon */}
        <View style={mainStyles.mainDisplay}>
          <Image source={{ uri: iconUrl }} style={mainStyles.mainWeatherIcon} />
          <View style={mainStyles.tempContainer}>
            <Text style={mainStyles.temp}>{tempRounded}</Text>
            <Text style={mainStyles.tempUnit}>°C</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={mainStyles.descriptionText}>
          {weather.weather[0].description}
        </Text>

        {/* Detailed Stats Card */}
        <View style={mainStyles.detailsCard}>
            <Text style={[mainStyles.cardTitle, { color: PRIMARY_COLOR }]}>Today's Highlights</Text>
            <View style={mainStyles.detailsGrid}>
                <WeatherDetail icon="🌡️" label="Feels Like" value={`${Math.round(weather.main.feels_like)}°C`} />
                <WeatherDetail icon="💧" label="Humidity" value={`${weather.main.humidity}%`} />
                <WeatherDetail icon="💨" label="Wind Speed" value={`${weather.wind.speed} m/s`} />
                <WeatherDetail icon="⬆️/⬇️" label="High/Low" value={`${Math.round(weather.main.temp_max)}° / ${Math.round(weather.main.temp_min)}°`} />
                <WeatherDetail icon="🎚️" label="Pressure" value={`${weather.main.pressure} hPa`} />
                <WeatherDetail icon="👁️" label="Visibility" value={`${(weather.visibility / 1000).toFixed(1)} km`} />
            </View>
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        
        <Text style={[globalStyles.title, { color: PRIMARY_COLOR }]}>Weather Insight ☀️</Text>

        {/* Search Input Bar */}
        <View style={globalStyles.searchContainer}>
          <TextInput
            style={globalStyles.input}
            placeholder="Search city..."
            placeholderTextColor="#888"
            value={inputCity}
            onChangeText={setInputCity}
            onSubmitEditing={handleSearch} 
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={[globalStyles.searchButton, { backgroundColor: PRIMARY_COLOR }]} 
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
            ) : (
                <Text style={globalStyles.searchButtonText}>🔎</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Conditional Content */}
        {loading && !error && (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} style={globalStyles.loader} />
        )}

        {!loading && error && (
            <Text style={globalStyles.errorText}>⚠️ {error}</Text>
        )}

        {!loading && !error && weather && (
          <>
            {renderCurrentWeather()}
            {forecast.length > 0 && <ForecastList forecast={forecast} />}
          </>
        )}

        {!loading && !error && !weather && (
            <View style={globalStyles.noDataView}>
                <Text style={globalStyles.noDataText}>Enter a city name above to get the latest weather information.</Text>
            </View>
        )}

      </ScrollView>
    </View>
  );
}

// --- Stylesheet for Flat, High-Contrast Design ---

// Global & Layout Styles
const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9", 
    },
    scrollContainer: {
        paddingTop: Platform.OS === 'android' ? 40 : 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
        minHeight: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 30,
        letterSpacing: 0.5,
    },
    
    // Search Bar
    searchContainer: {
        flexDirection: "row",
        marginBottom: 30,
        backgroundColor: 'white',
        borderRadius: 15,
        borderWidth: 1, 
        borderColor: '#eee',
        // Increased shadow for depth
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 8 },
        }),
    },
    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: "#333",
    },
    searchButton: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
    },
    searchButtonText: {
        fontSize: 22,
        color: "white",
    },
    loader: {
        marginTop: 50,
    },
    errorText: {
        marginTop: 20,
        textAlign: "center",
        color: "#d00000",
        fontSize: 18,
        fontWeight: "700",
    },
    noDataView: {
        marginTop: 50,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    noDataText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
    }
});

// Main Weather Display Styles
const mainStyles = StyleSheet.create({
    currentWeatherContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    cityName: {
      fontSize: 28,
      fontWeight: '700',
      color: '#333',
      marginBottom: 5,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '400',
      color: '#999',
      marginBottom: 20,
    },
    mainDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    mainWeatherIcon: {
        width: 140, 
        height: 140, 
    },
    tempContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    temp: {
        fontSize: 85,
        fontWeight: "100", 
        color: "#333",
        lineHeight: 85,
    },
    tempUnit: {
      fontSize: 40,
      fontWeight: '200',
      color: '#333',
      marginTop: 10,
    },
    descriptionText: {
        fontSize: 20,
        color: "#333",
        textTransform: 'capitalize',
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 10,
    },

    // Details Card
    detailsCard: {
        width: width * 0.9,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eee',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 12 },
        }),
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
});

// Individual Detail Row Styles
const detailStyles = StyleSheet.create({
    detailContainer: {
        width: '48%', 
        marginBottom: 15,
        flexDirection: 'column',
    },
    detailIcon: {
        fontSize: 20,
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '700',
        marginTop: 2,
    },
});

// Forecast Styles
const forecastStyles = StyleSheet.create({
    container: {
        marginTop: 10,
        paddingTop: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#333",
        marginBottom: 15,
    },
    scrollContainer: {
        paddingVertical: 5,
    },
    card: {
        padding: 10,
        backgroundColor: 'white',
        marginRight: 10,
        borderRadius: 15,
        alignItems: "center",
        width: 100,
        borderWidth: 1,
        borderColor: '#eee',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
            android: { elevation: 3 },
        }),
    },
    date: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#2a9d8f",
        marginBottom: 5,
    },
    icon: {
        width: 40, 
        height: 40,
    },
    temp: {
        fontSize: 18,
        fontWeight: "900",
        marginVertical: 5,
        color: "#333",
    },
    desc: {
        fontSize: 10,
        textAlign: "center",
        color: "#666",
        textTransform: 'capitalize',
    },
});