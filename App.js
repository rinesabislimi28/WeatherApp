import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Image, StatusBar,
  Alert, Keyboard, Platform, Dimensions, SafeAreaView,
  Animated
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

// --- Constants & API Configuration ---
const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY; // Using environment variable for security
const WEATHER_ICON_BASE_URL = "https://openweathermap.org/img/wn/";
const { width } = Dimensions.get('window');

// --- Helper Components ---

// Reusable component for weather metrics
const WeatherDetail = ({ icon, label, value }) => (
  <View style={detailStyles.card}>
    <View style={detailStyles.iconCircle}>
      <Text style={detailStyles.icon}>{icon}</Text>
    </View>
    <View>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  </View>
);

// Component to handle the 5-day forecast list 
const ForecastList = ({ forecast }) => (
  <View style={forecastStyles.container}>
    <Text style={forecastStyles.title}>Weekly Forecast</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 25, paddingBottom: 10 }}
    >
      {forecast.map((day, index) => (
        <View key={index} style={forecastStyles.card}>
          <Text style={forecastStyles.date}>{day.date}</Text>
          <Image
            source={{ uri: `${WEATHER_ICON_BASE_URL}${day.icon}@2x.png` }}
            style={forecastStyles.icon}
          />
          <Text style={forecastStyles.temp}>{day.temp}°</Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

export default function App() {
  // --- State Management (Three States: Loading, Success, Error) ---
  const [city, setCity] = useState("Pristina");
  const [inputCity, setInputCity] = useState("");
  const [weather, setWeather] = useState(null); // Success state
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state

  // Animation refs for Stage 5 polishing
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Function to trigger smooth UI entry
  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  // Dynamic background logic based on temperature
  const getBackgroundColors = () => {
    if (!weather) return ['#00c6ff', '#0072ff'];
    const temp = weather.main.temp;
    if (temp > 28) return ['#ff8e3c', '#ff2e63'];
    if (temp > 18) return ['#4facfe', '#00f2fe'];
    if (temp > 5) return ['#30cfd0', '#330867'];
    return ['#1e3c72', '#2a5298'];
  };

  // --- API Integration (Stage 1 & 3) ---
  const fetchData = useCallback(async (cityName) => {
    if (!cityName.trim()) return;

    Keyboard.dismiss();
    setLoading(true); // Start loading state
    setError(null);   // Reset error state

    try {
      const encodedCity = encodeURIComponent(cityName);

      // Fetch Current Weather (GET Request)
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${API_KEY}&units=metric`;
      const res = await fetch(weatherUrl);

      // Professional error handling for invalid cities
      if (!res.ok) throw new Error("City not found");

      const data = await res.json(); // Parsing JSON

      // Fetch 5-Day Forecast (Stage 4)
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${API_KEY}&units=metric`;
      const fRes = await fetch(forecastUrl);

      if (fRes.ok) {
        const fData = await fRes.json();
        // Extracting noon forecast for each day
        const daily = fData.list
          .filter(item => item.dt_txt.includes("12:00:00"))
          .map(item => ({
            date: new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: 'short' }),
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
          }));
        setForecast(daily);
      }

      setWeather(data); // Update success state
      startAnimation();
    } catch (err) {
      setError(err.message); // Update error state
    } finally {
      setLoading(false); // End loading state
    }
  }, []);

  // Hook to fetch initial data on mount
  useEffect(() => { fetchData(city); }, [fetchData]);

  return (
    <LinearGradient colors={getBackgroundColors()} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        <View style={styles.header}>
          <Text style={styles.appTitle}>Weatherly</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Search Stage: TextInput + Button */}
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Search city..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={inputCity}
              onChangeText={setInputCity}
              onSubmitEditing={() => fetchData(inputCity)}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={() => fetchData(inputCity)}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 20 }}>🔍</Text>}
            </TouchableOpacity>
          </View>

          {/* Conditional Rendering: Success State */}
          {weather && !loading && (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              <View style={styles.mainInfo}>
                <Text style={styles.cityText}>{weather.name}</Text>
                <Text style={styles.dateLabel}>{new Date().toDateString()}</Text>

                <View style={styles.tempRow}>
                  <Image
                    source={{ uri: `${WEATHER_ICON_BASE_URL}${weather.weather[0].icon}@4x.png` }}
                    style={styles.mainIcon}
                  />
                  <Text style={styles.mainTemp}>{Math.round(weather.main.temp)}°</Text>
                </View>

                <Text style={styles.weatherDesc}>{weather.weather[0].description}</Text>
              </View>

              {/* Grid for Humidity, Wind, etc. */}
              <View style={styles.grid}>
                <WeatherDetail icon="🌡️" label="Feels Like" value={`${Math.round(weather.main.feels_like)}°`} />
                <WeatherDetail icon="💧" label="Humidity" value={`${weather.main.humidity}%`} />
                <WeatherDetail icon="💨" label="Wind" value={`${weather.wind.speed}m/s`} />
                <WeatherDetail icon="👁️" label="Visibility" value={`${(weather.visibility / 1000).toFixed(1)}km`} />
              </View>

              <ForecastList forecast={forecast} />
            </Animated.View>
          )}

          {/* Conditional Rendering: Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Professional Styles (Stage 5) ---
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 10,
    alignItems: 'center'
  },
  appTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    opacity: 0.9,
    textTransform: 'uppercase'
  },
  scrollContent: {
    paddingBottom: 50
  },
  searchWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    margin: 25,
    borderRadius: 30,
    paddingLeft: 25,
    height: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  searchBtn: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainInfo: {
    alignItems: 'center',
    marginTop: 10
  },
  cityText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  mainTemp: {
    fontSize: 110,
    fontWeight: '200',
    color: '#fff',
    marginLeft: -15
  },
  mainIcon: {
    width: 160,
    height: 160
  },
  weatherDesc: {
    fontSize: 24,
    color: '#fff',
    textTransform: 'capitalize',
    fontWeight: '400',
    marginTop: -20,
    opacity: 0.95
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: 40
  },
  errorContainer: {
    marginTop: 100,
    alignItems: 'center'
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  }
});

const detailStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: '48%',
    padding: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 18
  },
  label:
  {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  value:
  {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 1
  }
});

const forecastStyles = StyleSheet.create({
  container:
  {
    marginTop: 40
  },
  title:
  {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 25,
    marginBottom: 20
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 35,
    alignItems: 'center',
    marginRight: 15,
    width: 105,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  date: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 14
  },
  icon: {
    width: 60,
    height: 60,
    marginVertical: 5
  },
  temp: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800'
  }
});