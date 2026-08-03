import { useState, useEffect } from 'react';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import AppCard from '../components/AppCard';
import FeaturedApps from '../components/FeaturedApps';
import OSFilter from '../components/OSFilter';
import StatsCard from '../components/StatsCard';
import { Download, Smartphone, Laptop, TrendingUp, Award, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [apps, setApps] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState('');
  const { showError } = useNotification();
