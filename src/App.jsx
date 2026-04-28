import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SearchRestaurantScreen from './screens/SearchRestaurantScreen';
import RestaurantDetailScreen from './screens/RestaurantDetailScreen';
import AddDishLogScreen from './screens/AddDishLogScreen';
import DishDetailScreen from './screens/DishDetailScreen';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/search" element={<SearchRestaurantScreen />} />
        <Route path="/restaurant/:id" element={<RestaurantDetailScreen />} />
        <Route path="/log/:restaurantId/:dishId" element={<AddDishLogScreen />} />
        <Route path="/dish/:id" element={<DishDetailScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}
