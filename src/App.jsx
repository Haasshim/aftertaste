import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import SearchRestaurantScreen from './screens/SearchRestaurantScreen';
import RestaurantDetailScreen from './screens/RestaurantDetailScreen';
import AddDishLogScreen from './screens/AddDishLogScreen';
import DishDetailScreen from './screens/DishDetailScreen';
import RestaurantLogsScreen from './screens/RestaurantLogsScreen';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />

          {/* Protected — unreachable by URL when logged out */}
          <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchRestaurantScreen /></ProtectedRoute>} />
          <Route path="/restaurant/:id" element={<ProtectedRoute><RestaurantDetailScreen /></ProtectedRoute>} />
          <Route path="/log/:restaurantId/:dishId" element={<ProtectedRoute><AddDishLogScreen /></ProtectedRoute>} />
          <Route path="/dish/:id" element={<ProtectedRoute><DishDetailScreen /></ProtectedRoute>} />
          <Route path="/journal/:restaurantKey" element={<ProtectedRoute><RestaurantLogsScreen /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
