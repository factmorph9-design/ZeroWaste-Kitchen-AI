/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone,
  Download,
  Camera, 
  Trash2, 
  Calendar, 
  ChefHat, 
  Plus, 
  Loader2, 
  AlertTriangle,
  Upload,
  X,
  PlusCircle,
  ShoppingBag,
  Bell,
  Globe,
  RefreshCw,
  Zap,
  ZapOff,
  Video,
  Circle,
  Square,
  Eye,
  FileText,
  BookOpen,
  MessageSquare,
  Send,
  User,
  Bot,
  Settings,
  Shield,
  Heart,
  Award,
  LogOut,
  Target,
  Minus,
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Coffee,
  Utensils,
  Moon,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  analyzeKitchenImage, 
  suggestRecipe, 
  suggestRecipeForSpecificItem, 
  kitchenChat,
  getStorageTip,
  generateMealPlan
} from "./services/geminiService.ts";
import { translations } from "./translations.ts";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  expiryDate: string;
  addedAt: string;
  thumbnail?: string;
}

interface Recipe {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  isCustom?: boolean;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'urgent'>('all');
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showRecipeBook, setShowRecipeBook] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState<InventoryItem | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState("Chef");
  const [dietaryPreference, setDietaryPreference] = useState("none");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [generatingSpecificId, setGeneratingSpecificId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeStorageTip, setActiveStorageTip] = useState<{ id: string, text: string } | null>(null);
  const [isFetchingTip, setIsFetchingTip] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<any[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [recipeBookView, setRecipeBookView] = useState<'recipes' | 'plan'>('recipes');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userCredits, setUserCredits] = useState<number>(10);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [showSplashAd, setShowSplashAd] = useState(false);
  const [splashCountdown, setSplashCountdown] = useState(15);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showAdNotice, setShowAdNotice] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timerStartAt, setTimerStartAt] = useState<number | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [videoChunks, setVideoChunks] = useState<Blob[]>([]);
  const [recipeServings, setRecipeServings] = useState(2);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const AD_LINK = "https://www.profitablecpmratenetwork.com/hspd5g89?key=52775445a65e9ce9bf02249ac09a26ff";
  const SPLASH_AD_LINK = "https://www.profitablecpmratenetwork.com/hspd5g89?key=52775445a65e9ce9bf02249ac09a26ff";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);
  
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const t = (lang && translations[lang]) ? translations[lang] : translations.en;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // New Recipe Form State
  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [newRecipeIngredients, setNewRecipeIngredients] = useState("");
  const [newRecipeInstructions, setNewRecipeInstructions] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem("kitchen_inventory");
    const savedRecipes = localStorage.getItem("kitchen_recipes");
    const savedLang = localStorage.getItem("kitchen_lang");
    const savedName = localStorage.getItem("kitchen_user_name");
    const savedDiet = localStorage.getItem("kitchen_diet");
    const savedPic = localStorage.getItem("kitchen_profile_pic");
    const savedCredits = localStorage.getItem("kitchen_credits");
    
    if (savedCredits) {
      setUserCredits(parseInt(savedCredits));
    } else {
      // First time user
      setUserCredits(10);
      localStorage.setItem("kitchen_credits", "10");
    }

    // Always show splash ad logic removed from mount effect to handle flow
    // setShowSplashAd(true);
    // setSplashCountdown(15);

    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory);
        if (Array.isArray(parsed)) setInventory(parsed);
      } catch (e) {
        console.error("Failed to load inventory", e);
      }
    }
    if (savedRecipes) {
      try {
        const parsed = JSON.parse(savedRecipes);
        if (Array.isArray(parsed)) setCustomRecipes(parsed);
      } catch (e) {
        console.error("Failed to load recipes", e);
      }
    }
    // Handle Splash Ad for non-first time users
    if (savedLang && savedLang !== "null") {
      setLang(savedLang);
      setShowSplashAd(true);
      setSplashCountdown(15);
    } else {
      setLang(null);
    }

    if (savedName) setUserName(savedName);
    if (savedDiet) setDietaryPreference(savedDiet);
    if (savedPic) setProfileImage(savedPic);
    const savedServings = localStorage.getItem("kitchen_servings");
    if (savedServings) setRecipeServings(parseInt(savedServings));
    const savedMealPlan = localStorage.getItem("kitchen_meal_plan");
    if (savedMealPlan) {
      try {
        const parsed = JSON.parse(savedMealPlan);
        if (Array.isArray(parsed)) setMealPlan(parsed);
      } catch (e) {
        console.error("Failed to load meal plan", e);
      }
    }
  }, []);

  // Save credits
  useEffect(() => {
    localStorage.setItem("kitchen_credits", userCredits.toString());
  }, [userCredits]);

  const earnCredits = () => {
    setShowAdNotice(true);
  };

  const startVerification = () => {
    setIsVerifying(true);
    setCountdown(30);
    setTimerStartAt(Date.now());
    setLastClickTime(Date.now());
    setIsFrozen(false);
    setShowAdNotice(false);
    setShowRewardModal(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVerifying && countdown > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        // Check if last click was more than 10 seconds ago
        if (now - lastClickTime < 10000) {
          setCountdown(prev => prev - 1);
          setIsFrozen(false);
        } else {
          setIsFrozen(true);
        }
      }, 1000);
    } else if (isVerifying && countdown === 0) {
      setIsVerifying(false);
      setUserCredits(prev => prev + 12);
      addNotification(t.successReward || "Credits Earned!");
      setTimerStartAt(null);
      setIsFrozen(false);
    }
    return () => clearInterval(interval);
  }, [isVerifying, countdown, lastClickTime, t.successReward]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showSplashAd && splashCountdown > 0) {
      interval = setInterval(() => {
        setSplashCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showSplashAd, splashCountdown]);

  const handleOpenAd = () => {
    setIsVerifying(true);
    setCountdown(30);
    setTimerStartAt(Date.now());
    setLastClickTime(Date.now());
    setIsFrozen(false);
    setShowAdPopup(false);
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("kitchen_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("kitchen_recipes", JSON.stringify(customRecipes));
  }, [customRecipes]);

  useEffect(() => {
    if (lang) {
      localStorage.setItem("kitchen_lang", lang);
    }
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("kitchen_user_name", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("kitchen_diet", dietaryPreference);
  }, [dietaryPreference]);

  useEffect(() => {
    if (profileImage) localStorage.setItem("kitchen_profile_pic", profileImage);
  }, [profileImage]);

  useEffect(() => {
    localStorage.setItem("kitchen_servings", recipeServings.toString());
  }, [recipeServings]);

  useEffect(() => {
    if (mealPlan.length > 0) {
      localStorage.setItem("kitchen_meal_plan", JSON.stringify(mealPlan));
    }
  }, [mealPlan]);

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 5));
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t.notificationTitle, { body: msg });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImage(file);
  };

  const processImage = async (file: Blob) => {
    setIsAnalyzing(true);
    setError(null);
    setShowCamera(false);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fullBase64 = event.target?.result as string;
        const base64 = fullBase64.split(",")[1];
        const mimeType = file.type || "image/jpeg";

        // Create smaller thumbnail for storage
        const thumb = await createThumbnail(fullBase64);

        try {
          const newItems = await analyzeKitchenImage(base64, mimeType, lang || "en");
          const itemsWithId = newItems.map((item: any) => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            addedAt: new Date().toISOString(),
            thumbnail: thumb
          }));
          setInventory(prev => [...prev, ...itemsWithId]);
          addNotification(`${t.notificationBody} (${newItems.length} ${t.itemsTotal})`);
        } catch (err: any) {
          setError(t.errorApi);
          console.error(err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsAnalyzing(false);
    }
  };

  const createThumbnail = (base64Prefix: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 150;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.6));
      };
      img.src = base64Prefix;
    });
  };

  const startCamera = async (mode?: 'user' | 'environment') => {
    setShowCamera(true);
    setError(null);
    const cameraMode = mode || facingMode;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: cameraMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setFacingMode(cameraMode);
    } catch (err) {
      setError(t.errorCamera);
      setShowCamera(false);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    stopCamera();
    startCamera(newMode);
  };

  const toggleFlash = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn } as any]
        });
        setIsFlashOn(!isFlashOn);
      } else {
        addNotification("Flash not supported on this camera");
      }
    } catch (err) {
      console.error("Flash error:", err);
    }
  };

  const startVideoRecording = () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitchen-video-${Date.now()}.mp4`;
      a.click();
      setVideoChunks([]);
      addNotification("Video saved to your device");
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            processImage(blob);
            stopCamera();
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  const deleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const getDaysDiff = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortedAndFilteredInventory = [...inventory]
    .sort((a, b) => {
      const diffA = getDaysDiff(a.expiryDate);
      const diffB = getDaysDiff(b.expiryDate);
      return diffA - diffB;
    })
    .filter(item => {
      if (inventoryFilter === 'urgent') {
        return getDaysDiff(item.expiryDate) <= 3;
      }
      return true;
    });

  const fetchStorageTip = async (id: string, name: string) => {
    setIsFetchingTip(id);
    try {
      const tip = await getStorageTip(name, lang);
      setActiveStorageTip({ id, text: tip });
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingTip(null);
    }
  };

  const fetchMealPlan = async () => {
    if (userCredits < 10) {
      setError(t.needMoreCredits + " " + t.watchToEarn);
      return;
    }
    setIsGeneratingPlan(true);
    setError(null);
    try {
      const plan = await generateMealPlan(inventory, lang || "en");
      if (Array.isArray(plan)) {
        setMealPlan(plan);
        setUserCredits(prev => prev - 10);
      } else {
        throw new Error("Invalid plan format received");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate meal plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const clearInventory = () => {
    setInventory([]);
    setShowClearConfirm(false);
    addNotification(lang === 'bn' ? 'সব পণ্য মুছে ফেলা হয়েছে' : 'Inventory cleared');
  };

  const updateExpiry = (id: string, newDate: string) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, expiryDate: newDate } : item));
    setShowEditor(null);
  };

  const getRecipeSuggestion = async (itemsToUse?: InventoryItem[]) => {
    if (userCredits < 10) {
      setError(t.needMoreCredits + " " + t.watchToEarn);
      return;
    }

    const targetItems = itemsToUse || inventory.filter(i => selectedItems.includes(i.id));
    
    if (targetItems.length === 0) {
      setError(t.noItems);
      return;
    }

    setIsGeneratingRecipe(true);
    setError(null);
    setShowSelector(false);
    try {
      const suggestion = await suggestRecipe(targetItems, lang || "en", recipeServings);
      setRecipe(suggestion);
      setShowRecipeModal(true);
      setUserCredits(prev => prev - 10);
    } catch (err) {
      setError("Failed to generate recipe.");
      console.error(err);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const getSpecificItemRecipe = async (item: InventoryItem) => {
    if (userCredits < 10) {
      setError(t.needMoreCredits + " " + t.watchToEarn);
      return;
    }

    setGeneratingSpecificId(item.id);
    setIsGeneratingRecipe(true);
    setError(null);
    try {
      const others = inventory.filter(i => i.id !== item.id).map(i => i.name);
      const suggestion = await suggestRecipeForSpecificItem(item.name, others, lang || "en", recipeServings);
      setRecipe(suggestion);
      setShowRecipeModal(true);
      setUserCredits(prev => prev - 10);
    } catch (err) {
      setError("Failed to generate recipe.");
      console.error(err);
    } finally {
      setIsGeneratingRecipe(false);
      setGeneratingSpecificId(null);
    }
  };

  const saveCustomRecipe = (title: string, ingredients: string[], steps: string[]) => {
    if (editingRecipeId) {
      setCustomRecipes(prev => prev.map(r => r.id === editingRecipeId ? { ...r, title, ingredients, instructions: steps } : r));
      setEditingRecipeId(null);
    } else {
      const newRecipe: Recipe = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        ingredients,
        instructions: steps,
        isCustom: true
      };
      setCustomRecipes(prev => [newRecipe, ...prev]);
    }
    setShowRecipeForm(false);
  };

  const deleteRecipe = (id: string) => {
    setCustomRecipes(prev => prev.filter(r => r.id !== id));
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    sendChatMessage(chatInput.trim());
  };

  const sendChatMessage = async (text: string) => {
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text }]);
    setIsTyping(true);
    
    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await kitchenChat(text, history, lang || "en");
      setChatMessages(prev => [...prev, { role: "model", text: response }]);
      speakText(response);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "model", text: "Something went wrong. I might be offline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const [recognition, setRecognition] = useState<any>(null);

  const startListening = () => {
    if (isListening && recognition) {
      recognition.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser");
      return;
    }

    const newRecognition = new SpeechRecognition();
    newRecognition.lang = lang === "bn" ? "bn-BD" : lang === "hi" ? "hi-IN" : "en-US";
    newRecognition.interimResults = false;

    newRecognition.onstart = () => setIsListening(true);
    newRecognition.onend = () => setIsListening(false);
    newRecognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      const errorMsgs: Record<string, string> = {
        'not-allowed': lang === 'bn' ? 'মাইক্রোফোন ব্যবহারের অনুমতি নেই।' : 'Microphone access denied.',
        'network': lang === 'bn' ? 'নেটওয়ার্ক সমস্যা।' : 'Network error.',
        'no-speech': lang === 'bn' ? 'কোনো কথা শোনা যায়নি।' : 'No speech detected.',
        'aborted': lang === 'bn' ? 'বন্ধ করা হয়েছে।' : 'Recognition aborted.'
      };
      
      const msg = errorMsgs[event.error] || (lang === 'bn' ? `সমস্যা: ${event.error}` : `Error: ${event.error}`);
      addNotification(msg);
    };
    newRecognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendChatMessage(transcript);
    };

    newRecognition.start();
    setRecognition(newRecognition);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean markdown for speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/<u>/g, '')
      .replace(/<\/u>/g, '')
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // Remove code blocks
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = lang === "bn" ? "bn-BD" : lang === "hi" ? "hi-IN" : "en-US";
    utterance.lang = targetLang;
    
    // Try to find a better matching voice
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsSpeaking(false);
    };

    const setVoice = () => {
      window.speechSynthesis.onvoiceschanged = null; // Clear listener
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try exact match first
        let preferredVoice = voices.find(v => v.lang === targetLang);
        // Then try language match
        if (!preferredVoice) {
          preferredVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
        }
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
      
      // Small delay helps with some browser bugs where cancel() hasn't fully cleared
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const getDaysLeft = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 3) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  // Main UI
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-0 sm:p-4">
      {/* 9:16 Aspect Ratio Container */}
      <div className="w-full h-screen sm:h-auto sm:max-w-[420px] sm:aspect-[9/16] bg-[#FDFCFB] text-[#1A1A1A] font-sans flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] relative sm:rounded-[3rem] sm:border-[10px] sm:border-[#121212] overflow-hidden transform-gpu transition-all">
        
        {/* Language Selection Overlay */}
        <AnimatePresence>
          {!lang && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#FDFCFB] z-[1000] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 w-full text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <Globe size={32} />
                </div>
                <h2 className="text-2xl font-black mb-8 tracking-tighter">Select Language</h2>
                <div className="space-y-4">
                  {[
                    { id: "en", label: "English", flag: "🇺🇸" },
                    { id: "bn", label: "বাংলা", flag: "🇧🇩" },
                    { id: "hi", label: "हिन्दी", flag: "🇮🇳" },
                    { id: "es", label: "Español", flag: "🇪🇸" },
                    { id: "fr", label: "Français", flag: "🇫🇷" }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                      setLang(l.id);
                      localStorage.setItem("kitchen_lang", l.id);
                      setShowSplashAd(true);
                      setSplashCountdown(15);
                      // Onboarding will be triggered from Splash Ad "Continue" button
                    }}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between font-semibold group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{l.flag}</span>
                        <span className="font-bold">{l.label}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 w-full flex-shrink-0">
          <div className="px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none mb-1">{t.title}</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div 
               whileHover={{ scale: 1.05 }}
               onClick={earnCredits}
               className="bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-amber-700">{userCredits}</span>
            </motion.div>
            <div className="relative group">
              <button className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
            </div>
            <button 
              onClick={() => setLang(null)}
              className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <Globe size={20} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <Upload size={20} />
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
          />
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      {!showCamera && (
        <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around z-[60] sm:absolute sm:rounded-b-none shadow-[0_-4px_20px_rgba(0,0,0,0.03)] selection:bg-transparent">
          <button 
            onClick={() => { setShowRecipeBook(false); setShowChat(false); setShowProfile(false); }}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-all ${!showRecipeBook && !showChat && !showProfile ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <ShoppingBag size={22} strokeWidth={!showRecipeBook && !showChat && !showProfile ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t.home}</span>
          </button>
          <button 
            onClick={() => setShowRecipeBook(true)}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-all ${showRecipeBook ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <BookOpen size={22} strokeWidth={showRecipeBook ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t.book}</span>
          </button>
          <div className="relative -mt-10">
            <button 
              onClick={startCamera}
              className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-white"
            >
              <Camera size={24} />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{t.scan}</span>
            </button>
          </div>
          <button 
            onClick={() => setShowChat(true)}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-all ${showChat ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <MessageSquare size={22} strokeWidth={showChat ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t.chat}</span>
          </button>
          <button 
            onClick={() => setShowProfile(true)}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-all ${showProfile ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <User size={22} strokeWidth={showProfile ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t.profile}</span>
          </button>
        </nav>
      )}

      {/* Floating AI Assistant Button (Hidden when chat is open) */}
      {!showChat && !showCamera && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-6 sm:absolute sm:bottom-28 sm:right-8 w-16 h-16 bg-white border border-emerald-100 rounded-3xl shadow-2xl flex items-center justify-center text-emerald-600 z-[55] group overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-50 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl" />
          <div className="relative flex flex-col items-center">
            <Bot size={28} className="animate-bounce-slow" />
            <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">AI</span>
          </div>
        </motion.button>
      )}

      <main className="flex-1 px-4 sm:px-6 py-8 pb-48 overflow-y-auto cursor-default overflow-x-hidden">
        {/* Top Promo/Reward Center */}
        <div className="mb-8">
          <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{t.rewardCenter}</span>
              </div>
              <h2 className="text-2xl font-black mb-4 leading-tight">{t.earnCredits}</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-6">{t.stayNotice}</p>
              <button 
                onClick={earnCredits}
                disabled={isVerifying}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/30 flex items-center gap-3"
              >
                <Sparkles size={16} />
                {t.earnNow}
              </button>
            </div>
            
            {/* Abstract decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-12 w-32 h-32 bg-amber-500/10 rounded-full -mb-16 blur-2xl pointer-events-none" />
            <Award size={120} className="absolute -top-4 -right-4 text-white/5 rotate-12 pointer-events-none" />
          </div>
        </div>

        {/* Banner Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight transition-all">{t.currentItems}</h2>
            {inventory.length > 0 && (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-all active:scale-95"
              >
                {t.clearAll}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
             <Calendar size={16} />
             <span>{new Date().toLocaleDateString(lang || undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} />
            </div>
            <p className="font-bold text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto p-1.5 hover:bg-red-100 rounded-full transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}

        <div className="space-y-8">
          {/* Main List */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm min-h-[300px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black">{t.currentItems}</h3>
              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-gray-100 rounded-2xl">
                  <button 
                    onClick={() => setInventoryFilter('all')}
                    className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${inventoryFilter === 'all' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                  >
                    {t.all}
                  </button>
                  <button 
                    onClick={() => setInventoryFilter('urgent')}
                    className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all inline-flex items-center gap-2 ${inventoryFilter === 'urgent' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {t.urgent}
                  </button>
                </div>
                {inventory.length > 0 && (
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title={t.clearAll}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                  {inventory.length} {t.itemsTotal}
                </div>
              </div>
            </div>

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-16 gap-5">
                <div className="relative">
                  <Loader2 className="animate-spin text-emerald-600" size={56} strokeWidth={2} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Eye size={20} className="text-emerald-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold mb-1">{t.loading}</p>
                  <p className="text-gray-400 text-xs">{t.scanning}</p>
                </div>
              </div>
            )}

            {!isAnalyzing && inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2rem] bg-gray-50/50 border-2 border-dashed border-gray-200 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-[1.5rem] flex items-center justify-center mb-6 text-gray-300">
                  <Plus size={32} />
                </div>
                <h4 className="text-xl font-extrabold mb-2">{t.noItems}</h4>
                <p className="text-gray-400 text-sm max-w-[200px] mx-auto leading-relaxed">{t.noItemsSub}</p>
                <button 
                  onClick={startCamera}
                  className="mt-6 px-6 py-3 bg-white border-2 border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 rounded-full font-bold transition-all text-sm"
                >
                  {t.cameraButton}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {[...inventory]
                    .filter(item => {
                      if (inventoryFilter === 'urgent') {
                        return getDaysLeft(item.expiryDate) <= 3;
                      }
                      return true;
                    })
                    .sort((a, b) => getDaysLeft(a.expiryDate) - getDaysLeft(b.expiryDate))
                    .map((item) => {
                      const daysLeft = getDaysLeft(item.expiryDate);
                      const isUrgent = daysLeft <= 3;
                      const isExpired = daysLeft < 0;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`group flex flex-col p-4 rounded-2xl hover:bg-gray-50 border transition-all duration-300 relative overflow-hidden ${
                            isExpired ? 'bg-gray-50/50 border-gray-100' : 
                            isUrgent ? 'bg-red-50/30 border-red-100' : 
                            'border-transparent hover:border-gray-100'
                          }`}
                        >
                          {isUrgent && !isExpired && (
                            <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-red-50 rounded-full opacity-50" />
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              {item.thumbnail ? (
                                <img 
                                  src={item.thumbnail} 
                                  className={`w-12 h-12 rounded-xl object-cover border border-gray-100 group-hover:scale-110 transition-transform ${isExpired ? 'grayscale' : ''}`} 
                                  alt={item.name} 
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black uppercase ${isUrgent ? 'bg-red-600' : 'bg-[#1A1A1A]'} text-white`}>
                                  {item.name.charAt(0)}
                                </div>
                              )}
                              <div className="max-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-bold text-base truncate ${isExpired ? 'text-gray-400 line-through' : ''}`}>{item.name}</h4>
                                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                    isExpired ? 'bg-gray-200 text-gray-500' : 
                                    daysLeft === 0 ? 'bg-orange-500 text-white' :
                                    isUrgent ? 'bg-red-500 text-white animate-pulse' : 
                                    'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {isExpired ? t.expired : daysLeft === 0 ? t.expiresToday : `${daysLeft} ${t.daysLeft}`}
                                  </div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{item.category}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => getSpecificItemRecipe(item)}
                                disabled={isGeneratingRecipe || userCredits < 10}
                                className={`p-2 rounded-xl transition-all disabled:opacity-30 ${userCredits < 10 ? 'text-gray-300' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                title={userCredits < 10 ? t.needMoreCredits : t.specificRecipe}
                              >
                                {generatingSpecificId === item.id ? <Loader2 size={18} className="animate-spin" /> : <ChefHat size={18} />}
                              </button>
                              <button 
                                onClick={() => {
                                  setNewRecipeTitle(item.name);
                                  setNewRecipeIngredients("");
                                  setNewRecipeInstructions("");
                                  setShowRecipeForm(true);
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                title={t.writeNote}
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (deleteConfirmId === item.id) {
                                    deleteItem(item.id);
                                    setDeleteConfirmId(null);
                                  } else {
                                    setDeleteConfirmId(item.id);
                                    setTimeout(() => setDeleteConfirmId(null), 3000);
                                  }
                                }}
                                className={`p-2.5 rounded-xl transition-all border flex items-center justify-center gap-2 ${
                                  deleteConfirmId === item.id 
                                    ? "bg-red-600 text-white border-red-600 px-4" 
                                    : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                }`}
                                title={t.delete}
                              >
                                {deleteConfirmId === item.id ? (
                                  <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'bn' ? 'মুছুন?' : 'Delete?'}</span>
                                ) : (
                                  <Trash2 size={20} />
                                )}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  fetchStorageTip(item.id, item.name);
                                }}
                                disabled={isFetchingTip === item.id}
                                className={`p-2.5 rounded-xl transition-all border flex items-center justify-center ${
                                  isFetchingTip === item.id 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse" 
                                    : "bg-white text-emerald-600 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50"
                                }`}
                                title={t.storageTip}
                              >
                                <Sparkles size={20} />
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {activeStorageTip?.id === item.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mb-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 relative group">
                                  <Bot size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-[11px] font-bold text-emerald-800 leading-relaxed pr-6">
                                    {activeStorageTip.text}
                                  </p>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setActiveStorageTip(null);
                                    }}
                                    className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-600 p-1"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => setShowEditor(item)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95 ${getExpiryStatus(daysLeft)}`}
                            >
                              <Calendar size={12} />
                              {daysLeft < 0 ? t.expired : daysLeft === 0 ? "!!" : `${daysLeft}${t.days.charAt(0)}`}
                            </button>
                            <span className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter">
                              {new Date(item.addedAt).toLocaleDateString(lang || undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* AI Recipe Tool */}
          <div className="bg-[#1A1A1A] text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ChefHat size={100} />
            </div>
            <h3 className="text-2xl font-black mb-4 relative z-10">{t.recipeMagic}</h3>
            <p className="text-gray-400 mb-6 leading-relaxed relative z-10 font-bold text-sm">
              {t.recipeDesc}
            </p>
            
            {/* Servings Selector */}
            <div className="relative z-10 mb-6 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                   <Target size={18} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">{t.servings}</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setRecipeServings(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <Minus size={14} />
                </button>
                <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-xl font-black leading-none">{recipeServings}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{t.person}</span>
                </div>
                <button 
                  onClick={() => setRecipeServings(prev => Math.min(10, prev + 1))}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => {
                setSelectedItems([]);
                setShowSelector(true);
              }}
              disabled={isGeneratingRecipe || inventory.length === 0 || userCredits < 10}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-[#1A1A1A] rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
            >
              {isGeneratingRecipe ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ChefHat size={20} />
              )}
              <span>{userCredits < 10 ? t.needMoreCredits : t.suggestRecipe}</span>
            </button>
            {userCredits < 10 && (
              <p className="text-center text-[10px] font-black text-amber-500 uppercase mt-4 animate-pulse">
                {t.watchToEarn}
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <RefreshCw size={16} />
              </div>
              <h3 className="text-lg font-black text-gray-900">{t.tipsTitle}</h3>
            </div>
            <ul className="space-y-4">
              {[
                lang === 'es' ? "Congela los plátanos maduros para batidos." : lang === 'fr' ? "Congelez les bananes mûres pour les smoothies." : lang === 'bn' ? "পাকা কলা স্মুদির জন্য ফ্রিজে রাখুন।" : lang === 'hi' ? "स्मूदी के लिए पके हुए केलों को फ्रीज करें।" : "Freeze overripe bananas for smoothies.",
                lang === 'es' ? "Las raíces se mantienen frescas en lugares oscuros." : lang === 'fr' ? "Les légumes racines restent frais dans l'obscurité." : lang === 'bn' ? "মাটির তলার সবজি অন্ধকার জায়গায় ভালো থাকে।" : lang === 'hi' ? "जड़ वाली सब्जियां अंधेरी जगहों पर ताज़ा रहती हैं।" : "Root vegetables stay fresh in dark places.",
                lang === 'es' ? "Revive las lechugas con agua helada." : lang === 'fr' ? "Faites revivre les salades flétries dans l'eau glacée." : lang === 'bn' ? "নেতিয়ে পড়া শাক বরফ জলে সতেজ করুন।" : lang === 'hi' ? "मुरझाई हुई साग-सब्जियों को बर्फ के पानी में ताज़ा करें।" : "Revive wilted greens in ice water."
              ].map((tip, i) => (
                <li key={i} className="flex gap-4 text-gray-600 leading-relaxed font-bold text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="absolute inset-x-0 bottom-0 z-50 bg-black rounded-t-[3rem] h-[75%] shadow-2xl border-t border-white/10 overflow-hidden">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               className="w-full h-full object-cover"
             />
             <canvas ref={canvasRef} className="hidden" />
             
             <div className="absolute top-6 right-6 flex flex-col gap-3">
                <button 
                  onClick={toggleCamera}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-xl transition-all"
                >
                  <RefreshCw size={18} />
                </button>
                <button 
                  onClick={toggleFlash}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl transition-all ${isFlashOn ? 'bg-amber-400 text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}
                >
                  {isFlashOn ? <Zap size={18} /> : <ZapOff size={18} />}
                </button>
             </div>

             <div className="absolute top-6 left-6 flex items-center gap-3 text-white">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="font-black text-[10px] uppercase tracking-widest text-white/80">
                  {isRecording ? 'Recording' : 'Live Capture'}
                </span>
             </div>

             <div className="absolute bottom-8 inset-x-0 px-8 flex items-center justify-between">
                <button 
                  onClick={stopCamera}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-xl transition-all"
                >
                  <X size={20} />
                </button>

                <button 
                  onClick={takePhoto}
                  disabled={isRecording}
                  className={`w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-90 transition-all border-4 border-white/20 shadow-xl ${isRecording ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                     <Camera size={28} />
                  </div>
                </button>

                <button 
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isRecording ? <Square size={18} /> : <Video size={18} />}
                </button>
             </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSplashAd && (
          <div className="fixed inset-0 z-[600] bg-[#050505] flex flex-col sm:absolute">
             <div className="flex-1 relative flex items-center justify-center">
                {/* Enhanced Loading Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
                  <div className="flex flex-col items-center gap-6 relative">
                    <div className="w-20 h-20 border-[3px] border-emerald-500/10 border-t-emerald-500 rounded-[2rem] animate-spin" />
                    <div className="text-center">
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">System Initializing</p>
                      <p className="text-white text-base font-black tracking-tight">{t.loadingAd || "Sponsored Preview"}</p>
                    </div>
                  </div>
                </div>
                <iframe 
                  src={SPLASH_AD_LINK} 
                  className="w-full h-full border-none relative z-10" 
                  title="Splash Ad"
                  allow="autoplay; encrypted-media; fullscreen"
                  referrerPolicy="no-referrer-when-downgrade"
                />

              <div className="absolute top-10 inset-x-0 flex justify-center px-4 pointer-events-none z-20">
                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 flex flex-col items-center gap-3 shadow-2xl min-w-[200px]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 text-[#050505] rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20">
                      {splashCountdown}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-white font-black text-xs uppercase tracking-widest leading-none mb-1">Ad Loading</h2>
                      <p className="text-emerald-400/60 text-[9px] font-bold uppercase tracking-tighter">Please wait a moment</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: (splashCountdown / 15) * 100 + "%" }}
                      transition={{ duration: 1, ease: "linear" }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              </div>
             </div>

             {splashCountdown === 0 && (
               <div className="p-8 bg-[#050505] border-t border-white/5 relative z-30">
                <motion.button 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowSplashAd(false);
                    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding_v1");
                    if (!hasSeenOnboarding) {
                      setShowOnboarding(true);
                      setOnboardingStep(0);
                    }
                  }}
                  className="w-full py-6 bg-emerald-500 text-[#050505] rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-400 shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3"
                >
                  {t.continueApp || "Continue to App"}
                  <ChevronRight size={20} />
                </motion.button>
               </div>
             )}
          </div>
        )}
      </AnimatePresence>

      {/* Item Extraction Loading State Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-[60] bg-emerald-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-white"
          >
             <motion.div 
               animate={{ scale: [1, 1.1, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="w-32 h-32 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mb-12 border-2 border-emerald-500/30"
             >
                <ShoppingBag size={48} className="text-emerald-400" />
             </motion.div>
             <h2 className="text-4xl font-black mb-4 text-center">{t.loading}</h2>
             <p className="text-emerald-400 font-bold uppercase tracking-widest animate-pulse">{t.scanning}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Expiry Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center p-6 pb-20">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setShowEditor(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl relative z-10 w-full max-w-xs border border-gray-100"
            >
              <h3 className="text-xl font-black mb-6">{t.editExpiry}</h3>
              <p className="text-gray-400 text-xs font-bold uppercase mb-4">{showEditor.name}</p>
              <input 
                type="date" 
                defaultValue={showEditor.expiryDate.split('T')[0]}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 outline-none mb-6 font-bold"
                onChange={(e) => updateExpiry(showEditor.id, new Date(e.target.value).toISOString())}
              />
              <button 
                onClick={() => setShowEditor(null)}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all active:scale-95"
              >
                {t.save}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="absolute inset-0 z-[110] flex flex-col bg-[#FDFCFB]">
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <User size={24} />
                </div>
                <h2 className="text-xl font-black">{t.profile}</h2>
              </div>
              <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              {/* Avatar Section */}
              <div className="flex flex-col items-center py-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl overflow-hidden border-4 border-white">
                    {profileImage ? (
                      <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button 
                    onClick={() => profilePicInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all border border-gray-100"
                  >
                    <Plus size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={profilePicInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setProfileImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div className="mt-6 text-center w-full">
                  <input 
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-transparent border-b-2 border-transparent focus:border-emerald-500 text-2xl font-black outline-none text-center w-full px-4 py-1"
                  />
                  <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Kitchen Chef</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-2xl font-black">{inventory.length}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{t.itemsTracked}</span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-2xl font-black">{customRecipes.length}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{t.recipesSaved}</span>
                </div>
                <div className="col-span-2 bg-[#1A1A1A] p-6 rounded-[2rem] text-white flex items-center gap-6 overflow-hidden relative">
                  <Award className="text-emerald-500 flex-shrink-0" size={40} />
                  <div>
                    <h4 className="font-black text-lg">Waste reduction Hero</h4>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">Level 3 • Top 5% this month</p>
                  </div>
                  <div className="absolute -right-6 -bottom-6 opacity-10">
                    <Target size={120} />
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">{t.preferences}</h3>
                
                <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Heart size={20} />
                      </div>
                      <div>
                        <p className="font-bold">{t.dietaryType}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{dietaryPreference}</p>
                      </div>
                    </div>
                    <select 
                      value={dietaryPreference}
                      onChange={(e) => setDietaryPreference(e.target.value)}
                      className="bg-gray-50 p-2 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-emerald-500"
                    >
                      <option value="none">None</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Keto</option>
                      <option value="gluten-free">Gluten Free</option>
                    </select>
                  </div>

                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Globe size={20} />
                      </div>
                      <p className="font-bold">App Language</p>
                    </div>
                    <button 
                      onClick={() => setLang(null)}
                      className="text-emerald-600 font-bold text-xs uppercase"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden mt-6">
                  <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Settings size={20} />
                      </div>
                      <p className="font-bold">{t.settings}</p>
                    </div>
                  </div>
                  <a 
                    href="/download-standalone"
                    className="p-5 flex items-center justify-between group cursor-pointer hover:bg-emerald-50 transition-all border-none w-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Standalone App</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">For Mobile & Offline</p>
                      </div>
                    </div>
                    <Download size={20} className="text-emerald-600" />
                  </a>
                  <div 
                    onClick={() => {
                        if(confirm('Reset all data? This cannot be undone.')) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="p-5 flex items-center justify-between group cursor-pointer hover:bg-red-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                        <LogOut size={20} />
                      </div>
                      <p className="font-bold text-red-600 uppercase text-xs tracking-widest">Clear Everything</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions Footer */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#FDFCFB] via-[#FDFCFB] to-transparent pt-12">
               <button 
                 onClick={() => setShowProfile(false)}
                 className="w-full py-5 bg-[#1A1A1A] text-white rounded-[2rem] font-black text-lg transition-all active:scale-95 shadow-2xl"
               >
                 Done
               </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Item Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <div className="absolute inset-0 z-[75] flex flex-col bg-[#FDFCFB]">
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100 bg-white">
              <h2 className="text-xl font-black">{t.selectItems}</h2>
              <button onClick={() => setShowSelector(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {inventory.map(item => (
                <button 
                  key={item.id}
                  onClick={() => {
                    setSelectedItems(prev => 
                      prev.includes(item.id) 
                        ? prev.filter(id => id !== item.id) 
                        : [...prev, item.id]
                    );
                  }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    selectedItems.includes(item.id) 
                      ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedItems.includes(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'
                  }`}>
                    {selectedItems.includes(item.id) && <Plus size={14} className="text-white rotate-45" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-gray-100 pb-10">
              <button 
                onClick={() => getRecipeSuggestion()}
                disabled={selectedItems.length === 0}
                className="w-full py-5 bg-emerald-600 disabled:bg-gray-200 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/10 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <ChefHat size={20} />
                {t.generate}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Recipe Book Modal */}
      <AnimatePresence>
        {showRecipeBook && (
          <div className="absolute inset-0 z-[70] flex flex-col bg-[#FDFCFB]">
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100 bg-white">
              <h2 className="text-xl font-black">{recipeBookView === 'recipes' ? t.myRecipes : t.dailyMeals}</h2>
              <button onClick={() => setShowRecipeBook(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="p-2 bg-gray-50/50 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar px-6">
              <button 
                onClick={() => setRecipeBookView('recipes')}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${recipeBookView === 'recipes' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
              >
                {t.recipeBook}
              </button>
              <button 
                onClick={() => setRecipeBookView('plan')}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${recipeBookView === 'plan' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
              >
                {t.mealPlan}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {recipeBookView === 'recipes' ? (
                <div className="space-y-6">
                  {/* Manual Entry Button */}
                  <button 
                    onClick={() => {
                        setEditingRecipeId(null);
                        setNewRecipeTitle("");
                        setNewRecipeIngredients("");
                        setNewRecipeInstructions("");
                        setShowRecipeForm(true);
                    }}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex flex-col items-center gap-2"
                  >
                    <PlusCircle size={24} />
                    <span>{t.writeRecipe}</span>
                  </button>

                  <div className="space-y-4">
                    {customRecipes.length === 0 && (
                      <div className="text-center py-10 grayscale opacity-20">
                        <ChefHat size={60} className="mx-auto mb-4" />
                        <p className="font-bold">{lang === 'bn' ? 'কোনো রেসিপি নেই' : 'No recipes yet'}</p>
                      </div>
                    )}
                    {customRecipes.map(r => (
                      <div key={r.id} className="group relative">
                        <button 
                          onClick={() => { setRecipe(r); setShowRecipeModal(true); }}
                          className="w-full p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between hover:shadow-lg transition-all text-left pr-20"
                        >
                          <div>
                            <h4 className="font-black text-lg mb-1">{r.title}</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase">{r.isCustom ? 'Custom' : 'AI Generated'}</p>
                          </div>
                          <ChefHat className="text-emerald-500" size={24} />
                        </button>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingRecipeId(r.id || null);
                                setNewRecipeTitle(r.title);
                                setNewRecipeIngredients((r.ingredients || []).join('\n'));
                                setNewRecipeInstructions((r.instructions || []).join('\n'));
                                setShowRecipeForm(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <FileText size={18} />
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation();
                                if (deleteConfirmId === r.id) {
                                  if (r.id) deleteRecipe(r.id);
                                  setDeleteConfirmId(null);
                                } else {
                                  setDeleteConfirmId(r.id || null);
                                  setTimeout(() => setDeleteConfirmId(null), 3000);
                                }
                              }}
                              className={`p-2.5 rounded-xl transition-all border flex items-center justify-center gap-2 ${
                                deleteConfirmId === r.id 
                                  ? "bg-red-600 text-white border-red-600 px-4" 
                                  : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                              }`}
                              title={t.delete}
                            >
                              {deleteConfirmId === r.id ? (
                                <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'bn' ? 'মুছুন?' : 'Delete?'}</span>
                              ) : (
                                <Trash2 size={20} />
                              )}
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {mealPlan.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Calendar size={40} />
                      </div>
                      <h3 className="text-xl font-black mb-2">{t.dailyMeals}</h3>
                      <p className="text-gray-400 font-bold text-xs mb-8 max-w-[200px] mx-auto leading-relaxed">
                        {lang === 'bn' 
                          ? 'আপনার ইনভেন্টরি অনুযায়ী ৩ দিনের খাবারের পরিকল্পনা তৈরি করুন।' 
                          : 'Generate a personalized 3-day meal plan based on your kitchen inventory.'}
                      </p>
                      <button 
                        onClick={fetchMealPlan}
                        disabled={isGeneratingPlan || inventory.length === 0 || userCredits < 10}
                        className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                      >
                        {isGeneratingPlan ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        {isGeneratingPlan ? t.generatingMealPlan : (lang === 'bn' ? 'তৈরি করুন' : 'Generate Plan')}
                      </button>
                      {userCredits < 10 && (
                        <p className="text-center text-[10px] font-black text-amber-500 uppercase mt-4">
                          {t.needMoreCredits}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <button 
                        onClick={fetchMealPlan}
                        disabled={isGeneratingPlan}
                        className="w-full py-4 border border-emerald-100 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                       >
                         {isGeneratingPlan ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                         {lang === 'bn' ? 'আবার তৈরি করুন' : 'Regenerate Plan'}
                       </button>
                       
                       {mealPlan.map((day, i) => (
                         <motion.div 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.1 }}
                           key={day.day} 
                           className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden"
                         >
                           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 -mr-16 -mt-16 rounded-full opacity-50" />
                           <h4 className="text-lg font-black mb-6 flex items-center gap-3 relative">
                             <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm">
                               {day.day}
                             </span>
                             {lang === 'bn' ? `${day.day} নম্বর দিন` : `Day ${day.day}`}
                           </h4>
                           
                           <div className="space-y-6 relative">
                             {[
                               { time: 'breakfast', icon: <Coffee size={18} />, color: 'orange' },
                               { time: 'lunch', icon: <Utensils size={18} />, color: 'emerald' },
                               { time: 'dinner', icon: <Moon size={18} />, color: 'indigo' }
                             ].map((m) => (
                               <div key={m.time} className="flex gap-4">
                                 <div className={`w-10 h-10 rounded-2xl bg-${m.color}-50 text-${m.color}-600 flex items-center justify-center flex-shrink-0`}>
                                   {m.icon}
                                 </div>
                                 <div className="flex-1">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{m.time}</p>
                                   <p className="text-sm font-bold text-gray-700 leading-snug">
                                     {day.meals ? (day.meals as any)[m.time] : '...'}
                                   </p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </motion.div>
                       ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Chat Assistant Modal */}
      <AnimatePresence>
        {showChat && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-[#FDFCFB]">
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black">{t.chatAssistant}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isSpeaking ? (lang === 'bn' ? 'কথা বলছি...' : 'Speaking...') : 'Online'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <button 
                    onClick={stopSpeaking}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Stop Speaking"
                  >
                    <X size={20} />
                  </button>
                )}
                <button 
                  onClick={() => setShowChat(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {chatMessages.length === 0 && (
                <div className="flex justify-center pt-10">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 max-w-[80%] text-center">
                    <p className="text-gray-600 font-medium">{t.chatWelcome}</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-gray-100'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-10">
              <div className="flex gap-3 items-center">
                <button 
                  onClick={startListening}
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border ${
                    isListening 
                      ? "bg-red-600 border-red-600 text-white animate-pulse" 
                      : "bg-gray-50 border-gray-100 text-gray-400 hover:text-emerald-600"
                  }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder={isListening ? t.listening : t.chatPlaceholder}
                    disabled={isListening}
                    className="w-full pl-6 pr-16 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[2rem] outline-none font-bold transition-all disabled:opacity-50"
                  />
                  <button 
                    onClick={handleChat}
                    disabled={!chatInput.trim() || isTyping || isListening}
                    className="absolute right-2 top-2 w-12 h-12 bg-emerald-600 disabled:bg-gray-200 text-white rounded-full flex items-center justify-center transition-all active:scale-90 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                  >
                    {isTyping ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Recipe Creator Form Modal */}
      <AnimatePresence>
        {showRecipeForm && (
          <div className="absolute inset-0 z-[80] flex flex-col bg-[#FDFCFB]">
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100 bg-white">
              <h2 className="text-xl font-black">{t.writeRecipe}</h2>
              <button 
                onClick={() => setShowRecipeForm(false)} 
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">
                    {t.titlePlaceholder}
                  </label>
                  <input 
                    type="text"
                    value={newRecipeTitle}
                    onChange={(e) => setNewRecipeTitle(e.target.value)}
                    placeholder="My Special Dish..."
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-emerald-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">
                    {t.ingredients}
                  </label>
                  <textarea 
                    value={newRecipeIngredients}
                    onChange={(e) => setNewRecipeIngredients(e.target.value)}
                    placeholder={t.ingredientsPlaceholder}
                    rows={4}
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-emerald-500 outline-none font-bold resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">
                    {t.steps}
                  </label>
                  <textarea 
                    value={newRecipeInstructions}
                    onChange={(e) => setNewRecipeInstructions(e.target.value)}
                    placeholder={t.instructionsPlaceholder}
                    rows={6}
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-emerald-500 outline-none font-bold resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-10">
              <button 
                onClick={() => {
                  if (!newRecipeTitle) return;
                  saveCustomRecipe(
                    newRecipeTitle, 
                    newRecipeIngredients.split('\n').filter(i => i.trim()), 
                    newRecipeInstructions.split('\n').filter(i => i.trim())
                  );
                  setShowRecipeForm(false);
                }}
                disabled={!newRecipeTitle}
                className="w-full py-5 bg-emerald-600 disabled:bg-gray-200 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/10 hover:bg-emerald-700 transition-all active:scale-95"
              >
                {t.saveRecipe}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Recipe Modal */}
      <AnimatePresence>
        {showRecipeModal && recipe && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRecipeModal(false)}
              className="absolute inset-0 bg-[#1A1A1A]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh] sm:max-h-[80vh]"
            >
              <div className="w-full md:w-1/3 bg-[#1A1A1A] p-10 text-white overflow-y-auto">
                <ChefHat className="text-emerald-500 mb-8" size={32} />
                <h2 className="text-3xl font-black mb-8 leading-tight">{recipe.title}</h2>
                
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">{t.ingredients}</h4>
                <ul className="space-y-3 mb-8">
                  {(recipe.ingredients || []).map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm font-medium">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>

                {!recipe.id && !recipe.isCustom && (
                  <button 
                    onClick={() => {
                      saveCustomRecipe(recipe.title, recipe.ingredients, recipe.instructions);
                      setShowRecipeModal(false);
                      addNotification("Recipe saved to book!");
                    }}
                    className="w-full py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={14} />
                    {t.saveToBook}
                  </button>
                )}
              </div>
              <div className="flex-1 p-10 overflow-y-auto bg-white">
                <div className="flex justify-between items-start mb-10">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.steps}</h3>
                  <button onClick={() => setShowRecipeModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                </div>
                <div className="space-y-8">
                  {(recipe.instructions || []).map((step, i) => (
                    <div key={i} className="flex gap-6 relative">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black font-mono text-sm">
                        {(i + 1).toString().padStart(2, '0')}
                      </div>
                      <p className="text-gray-700 leading-relaxed font-medium pt-1 text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Global Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:absolute">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setShowClearConfirm(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 w-full max-w-sm text-center border border-gray-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black mb-2">{t.confirmClear}</h3>
              <p className="text-gray-400 font-bold text-xs mb-8 leading-relaxed">
                {lang === 'bn' 
                  ? 'এই কাজটি আর ফেরানো যাবে না। আপনি কি নিশ্চিত?' 
                  : 'This will remove all items from your kitchen. Are you sure?'}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all border border-gray-100"
                >
                  {t.close.toUpperCase()}
                </button>
                <button 
                  onClick={clearInventory}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
                >
                  {t.delete.toUpperCase()}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:absolute">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 w-full max-w-sm text-center border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <motion.div 
                  className="h-full bg-emerald-600"
                  animate={{ width: `${((onboardingStep + 1) / 4) * 100}%` }}
                />
              </div>

              <div className="mb-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={onboardingStep}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.2rem] flex items-center justify-center mb-8 shadow-inner">
                      {onboardingStep === 0 && <Bot size={48} className="animate-bounce-slow" />}
                      {onboardingStep === 1 && <Camera size={48} />}
                      {onboardingStep === 2 && <ChefHat size={48} />}
                      {onboardingStep === 3 && <Sparkles size={48} className="text-amber-500" />}
                    </div>
                    
                    <h3 className="text-2xl font-black mb-4 leading-tight">
                      {onboardingStep === 0 && t.welcome}
                      {onboardingStep === 1 && t.onboardingScan}
                      {onboardingStep === 2 && t.onboardingRecipe}
                      {onboardingStep === 3 && t.onboardingChat}
                    </h3>
                    
                    <p className="text-gray-400 font-bold text-sm leading-relaxed max-w-[240px]">
                      {onboardingStep === 0 && t.onboardingDesc}
                      {onboardingStep === 1 && t.onboardingScanDesc}
                      {onboardingStep === 2 && t.onboardingRecipeDesc}
                      {onboardingStep === 3 && t.onboardingChatDesc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    if (onboardingStep < 3) {
                      setOnboardingStep(prev => prev + 1);
                    } else {
                      setShowOnboarding(false);
                      localStorage.setItem("hasSeenOnboarding_v1", "true");
                    }
                  }}
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {onboardingStep < 3 ? (t.next || "Next") : (t.getStarted || "Get Started")}
                </button>
                <button 
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem("hasSeenOnboarding_v1", "true");
                  }}
                  className="text-gray-300 font-black text-[10px] uppercase tracking-widest hover:text-gray-500 transition-all"
                >
                  {t.skip || "Skip Tour"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ad Notice Modal */}
      <AnimatePresence>
        {showAdNotice && (
          <div className="absolute inset-0 z-[750] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm sm:absolute">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 w-full max-w-sm text-center border border-gray-100"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black mb-4">{t.rewardCenter || "Reward Center"}</h3>
              <p className="text-gray-500 text-sm font-bold leading-relaxed mb-8">
                {t.stayWarning || "Wait! To keep the timer running and earn rewards, you must click on the screen at least once every 10 seconds. Total time: 30s."}
              </p>
              <div className="space-y-4">
                <button 
                  onClick={startVerification}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {t.earnNow || "Start Earning"}
                </button>
                <button 
                  onClick={() => setShowAdNotice(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                >
                  {t.close || "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVerifying && (
          <div 
            className="fixed inset-0 z-[700] bg-[#050505] flex flex-col sm:absolute cursor-pointer"
            onClick={() => {
              setLastClickTime(Date.now());
              setIsFrozen(false);
            }}
          >
            <div className="flex-1 relative bg-black flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 border-[3px] border-emerald-500/10 border-t-emerald-500 rounded-[2rem] animate-spin" />
                  <div className="text-center">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Reward Protocol</p>
                    <p className="text-white text-base font-black tracking-tight">{t.loadingAd || "Loading Advertisement..."}</p>
                  </div>
                </div>
              </div>
              <iframe 
                src={AD_LINK} 
                className="w-full h-full border-none relative z-10" 
                title="Advertisement"
                allow="autoplay; encrypted-media; fullscreen"
                referrerPolicy="no-referrer-when-downgrade"
              />
              
              {/* Optional: Add a transparent overlay if you strictly need click tracking, 
                  but for now let's ensure the ad shows first by making it interactive */}
               <div 
                 className="absolute inset-0 z-20 cursor-pointer"
                 onClick={(e) => {
                   // This allows us to track clicks while letting the ad below be visible
                   // We don't stopPropagation so the parent can also catch it
                   setLastClickTime(Date.now());
                   setIsFrozen(false);
                 }}
               />
              
              <AnimatePresence>
                {isFrozen && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[30] bg-[#050505]/60 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl scale-125 border-4 border-white/20">
                      <ZapOff size={48} className="animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">{lang === 'bn' ? 'টাইমার থেমে গেছে!' : 'Reward Frozen!'}</h2>
                    <p className="text-red-200 text-sm font-bold leading-relaxed mb-10">
                      {t.frozenText || "Touch the screen immediately to continue earning credits. Don't leave the screen inactive!"}
                    </p>
                    <div className="py-4 px-8 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest animate-bounce">
                      {t.clickToResume || "Click to Resume"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="absolute top-10 inset-x-8 z-40 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all duration-500 shadow-xl ${isFrozen ? 'bg-red-600 text-white animate-shake' : 'bg-emerald-500 text-[#050505] shadow-emerald-500/20'}`}>
                      {countdown}
                    </div>
                    <div>
                      <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">{lang === 'bn' ? 'চলমান রিওয়ার্ড' : 'Active Reward'}</h4>
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                         <p className={`text-[10px] font-black uppercase tracking-widest ${isFrozen ? 'text-red-400' : 'text-emerald-400'}`}>
                           {isFrozen ? 'System Halted' : 'Earning progress'}
                         </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Potential</span>
                     <div className="flex items-center gap-1.5 text-amber-500">
                        <Zap size={12} className="fill-amber-500" />
                        <span className="text-lg font-black tracking-tighter">+12 Cr.</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {countdown === 0 && (
              <div className="p-8 bg-[#050505] border-t border-white/5 relative z-50">
                <button 
                  onClick={() => setIsVerifying(false)}
                  className="w-full py-6 bg-emerald-500 text-[#050505] rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-400 shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3"
                >
                  {t.successReward || "Claim Reward"} - {t.close || "Close"}
                </button>
              </div>
            )}
          </div>
        )}

        {showRewardModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 sm:absolute">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowRewardModal(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 w-full max-w-sm text-center border border-gray-100"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
                <Award size={40} />
              </div>
              <h3 className="text-2xl font-black mb-4 leading-tight">{t.earnCredits}</h3>
              <p className="text-gray-400 font-bold text-sm mb-8 leading-relaxed">
                {t.stayWarning}
              </p>
              <button 
                onClick={startVerification}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {t.earnNow}
                <Sparkles size={18} />
              </button>
              <button 
                onClick={() => setShowRewardModal(false)}
                className="mt-6 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-gray-600"
              >
                {t.skip}
              </button>
            </motion.div>
          </div>
        )}

        {showAdPopup && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 sm:absolute">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 w-full max-w-sm text-center border border-gray-100"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-100">
                <Zap size={40} className="fill-amber-600" />
              </div>
              <h3 className="text-2xl font-black mb-4 leading-tight">Welcome Bonus!</h3>
              <p className="text-gray-400 font-bold text-sm mb-8 leading-relaxed">
                Enjoy your 10 free credits to start generating smart recipes today.
              </p>
              <button 
                onClick={handleOpenAd}
                className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 shadow-xl shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Claim More Credits
                <Sparkles size={18} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function CheckIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
