import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  Heart,
  Droplets,
  Star,
  CheckCircle,
  Users,
  Award,
  Search,
  Menu,
  X,
  AlertTriangle,
  Download,
  Activity,
  Clock
} from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // Composant d'analyse avec le même style que la page d'accueil
  const AnalysisApp = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [userName, setUserName] = useState('');
    const [error, setError] = useState(null);
    const [apiStatus, setApiStatus] = useState('connected');
    const fileInputRef = useRef(null);

    // Configuration API
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    // Vérifier le statut de l'API au chargement
    useEffect(() => {
      checkApiStatus();
    }, []);

    const checkApiStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('error');
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 15 * 1024 * 1024) {
          setError('Le fichier est trop volumineux. Taille maximale: 15MB');
          return;
        }

        if (!file.type.startsWith('image/')) {
          setError('Veuillez sélectionner une image valide (JPG, PNG, etc.)');
          return;
        }

        setSelectedImage(file);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
        setAnalysis(null);
      }
    };

    const analyzeImage = async () => {
      if (!selectedImage) {
        setError('Veuillez d\'abord sélectionner une image');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        // Préparer les données pour l'upload
        const formData = new FormData();
        formData.append('file', selectedImage);

        console.log('Envoi vers SkinCare CLIP API:', `${API_BASE_URL}/api/analyze`);

        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(120000), // 2 minutes timeout
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error && typeof errorData.error === 'object') {
            throw new Error(errorData.error.error || errorData.error.reason || 'Erreur de validation');
          }
          throw new Error(errorData.error || `Erreur API: ${response.status}`);
        }

        const result = await response.json();
        console.log('Résultat SkinCare CLIP:', result);
        setAnalysis(result);

      } catch (error) {
        console.error('Erreur lors de l\'analyse CLIP:', error);
        setError(`Erreur lors de l'analyse: ${error.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Fonction pour télécharger le rapport skincare
    const downloadReport = () => {
      if (!analysis) return;

      const report = {
        user_name: userName || 'Non spécifié',
        analysis_date: new Date().toISOString(),
        analysis_method: 'CLIP (OpenAI)',
        model_version: 'clip-vit-base-patch32',
        analysis_id: analysis.id,
        skin_analysis: {
          skin_type: analysis.skin_type,
          problems_detected: analysis.problems_detected,
          skin_condition: analysis.skin_condition,
          confidence_note: analysis.confidence_note
        },
        personalized_recommendations: analysis.recommendations,
        disclaimer: analysis.recommendations.disclaimer
      };

      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `skincare_analysis_${userName || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };

    // Fonctions utilitaires pour le design
    const getConfidenceColor = (confidence) => {
      if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
      if (confidence >= 0.6) return 'text-orange-600 bg-orange-50 border-orange-200';
      return 'text-red-600 bg-red-50 border-red-200';
    };

    const getSeverityColor = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'high':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'normal':
          return 'text-green-600 bg-green-50 border-green-200';
        case 'low':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
          return 'text-purple-600 bg-purple-50 border-purple-200';
      }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100">
          {/* Navigation similaire à la page d'accueil */}
          <nav className="bg-white/90 backdrop-blur-sm border-b border-purple-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="text-white" size={18} />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SKINCARE AI
                </span>
                </div>

                {/* Bouton retour */}
                <button
                    onClick={() => setCurrentPage('home')}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-200 hover:border-purple-300"
                >
                  <ArrowRight className="rotate-180" size={18} />
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section pour l'analyse */}
          <div className="py-12 bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  ANALYSE
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> IA</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
                  Découvrez votre type de peau et recevez des recommandations personnalisées grâce à notre IA CLIP
                </p>

                {/* Statut API avec design amélioré */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border ${
                    apiStatus === 'connected'
                        ? 'bg-green-50/80 text-green-800 border-green-200'
                        : apiStatus === 'error'
                            ? 'bg-red-50/80 text-red-800 border-red-200'
                            : 'bg-yellow-50/80 text-yellow-800 border-yellow-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                      apiStatus === 'connected' ? 'bg-green-500' :
                          apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  API {apiStatus === 'connected' ? 'Connectée' : apiStatus === 'error' ? 'Déconnectée' : 'Vérification...'}
                  <span className="text-xs opacity-75">(CLIP-ViT-B/32)</span>
                </div>
              </div>

              {/* Affichage des erreurs avec design amélioré */}
              {error && (
                  <div className="mb-8 max-w-2xl mx-auto">
                    <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-600" />
                        <span className="text-red-800 font-medium">Erreur</span>
                      </div>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
              )}

              {/* Contenu principal avec design unifié */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                {/* Section Upload avec design similaire à la page d'accueil */}
                <div className="space-y-8">
                  {/* Card Upload principale */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Camera className="text-white" size={20} />
                      </div>
                      Photo de votre peau
                    </h2>

                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-400 transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                      <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                      />

                      {imagePreview ? (
                          <div className="space-y-6">
                            <img
                                src={imagePreview}
                                alt="Image sélectionnée"
                                className="max-w-full h-64 object-contain mx-auto rounded-xl shadow-lg"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              <Upload size={20} />
                              Changer d'image
                            </button>
                          </div>
                      ) : (
                          <div
                              onClick={() => fileInputRef.current?.click()}
                              className="cursor-pointer space-y-6"
                          >
                            <div className="flex justify-center">
                              <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center">
                                <Camera size={40} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-800 mb-2">
                                Uploadez votre photo
                              </p>
                              <p className="text-gray-600">
                                Formats: JPG, PNG, WebP (max. 15MB)<br/>
                                Éclairage naturel recommandé, sans maquillage
                              </p>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Informations utilisateur */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Users className="text-white" size={16} />
                      </div>
                      Informations
                    </h3>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Votre prénom (optionnel)
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="ex: Sarah, Alex..."
                        className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Capacités CLIP */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Eye className="text-white" size={16} />
                      </div>
                      Analyse CLIP Avancée
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <Droplets size={20} className="text-blue-500" />
                        <span className="text-gray-700">Détection du type de peau</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                        <Search size={20} className="text-green-500" />
                        <span className="text-gray-700">Identification des problèmes</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-lg border border-pink-100">
                        <Heart size={20} className="text-pink-500" />
                        <span className="text-gray-700">Recommandations personnalisées</span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'analyse avec design premium */}
                  <button
                      onClick={analyzeImage}
                      disabled={!selectedImage || isAnalyzing || apiStatus !== 'connected'}
                      className={`w-full py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                          !selectedImage || isAnalyzing || apiStatus !== 'connected'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                      }`}
                  >
                    {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          Analyse CLIP en cours...
                        </>
                    ) : (
                        <>
                          <Sparkles size={24} />
                          ANALYSER MA PEAU
                          <ArrowRight size={20} />
                        </>
                    )}
                  </button>
                </div>

                {/* Section Résultats avec design unifié */}
                <div className="space-y-8">
                  {analysis ? (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-8">
                        <div className="flex justify-between items-center mb-8">
                          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                              <Shield className="text-white" size={24} />
                            </div>
                            Analyse Complète
                          </h2>
                          <button
                              onClick={downloadReport}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            <Download size={16} />
                            Rapport
                          </button>
                        </div>

                        {/* Métadonnées de l'analyse */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock size={20} className="text-purple-600" />
                            <span className="font-bold text-purple-800">Analyse CLIP Terminée</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-purple-600 font-medium">Modèle:</span>
                              <span className="ml-2 font-bold">CLIP-ViT-B/32</span>
                            </div>
                            <div>
                              <span className="text-purple-600 font-medium">ID:</span>
                              <span className="ml-2 font-mono text-xs">{analysis.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Type de peau */}
                        <div className="mb-8">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Droplets className="text-white" size={16} />
                            </div>
                            Type de Peau Détecté
                          </h3>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl font-bold text-blue-800 capitalize">
                            {analysis.skin_type.category}
                          </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getConfidenceColor(analysis.skin_type.confidence)}`}>
                            {Math.round(analysis.skin_type.confidence * 100)}% confiance
                          </span>
                            </div>
                            {analysis.skin_type.all_scores && Object.keys(analysis.skin_type.all_scores).length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm text-blue-700 mb-3 font-medium">Scores détaillés:</p>
                                  <div className="space-y-2">
                                    {Object.entries(analysis.skin_type.all_scores)
                                        .sort(([,a], [,b]) => b - a)
                                        .map(([type, score]) => (
                                            <div key={type} className="flex justify-between items-center text-sm bg-white/50 p-2 rounded-lg">
                                              <span className="text-blue-800 capitalize font-medium">{type}</span>
                                              <span className="text-blue-700 font-bold">{Math.round(score * 100)}%</span>
                                            </div>
                                        ))}
                                  </div>
                                </div>
                            )}
                          </div>
                        </div>

                        {/* Problèmes détectés */}
                        {analysis.problems_detected && analysis.problems_detected.length > 0 && (
                            <div className="mb-8">
                              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                  <Search className="text-white" size={16} />
                                </div>
                                Problèmes Détectés ({analysis.problems_detected.length})
                              </h3>
                              <div className="grid gap-4">
                                {analysis.problems_detected.map((problem, index) => (
                                    <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                                      <div className="flex justify-between items-center">
                                <span className="font-bold text-orange-800 capitalize text-lg">
                                  {problem.condition}
                                </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getConfidenceColor(problem.confidence)}`}>
                                  {Math.round(problem.confidence * 100)}%
                                </span>
                                      </div>
                                    </div>
                                ))}
                              </div>
                            </div>
                        )}

                        {/* État de la peau */}
                        <div className="mb-8">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <Heart className="text-white" size={16} />
                            </div>
                            État de la Peau
                          </h3>
                          <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                            <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-pink-800 capitalize">
                            {analysis.skin_condition.category}
                          </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getConfidenceColor(analysis.skin_condition.confidence)}`}>
                            {Math.round(analysis.skin_condition.confidence * 100)}% confiance
                          </span>
                            </div>
                          </div>
                        </div>

                        {/* Recommandations avec design premium */}
                        <div className="mb-8">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <CheckCircle className="text-white" size={16} />
                            </div>
                            Routine Skincare Personnalisée
                          </h3>
                          <div className="space-y-6">
                            {/* Étapes de routine */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                              <h4 className="font-bold text-green-800 mb-4 text-lg">Routine Quotidienne</h4>
                              <ul className="space-y-3">
                                {analysis.recommendations.routine_steps.map((step, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                      <span className="text-green-800 font-medium">{step}</span>
                                    </li>
                                ))}
                              </ul>
                            </div>

                            {/* Produits recommandés */}
                            {analysis.recommendations.products_recommended.length > 0 && (
                                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                                  <h4 className="font-bold text-purple-800 mb-4 text-lg">Produits Recommandés</h4>
                                  <ul className="space-y-2">
                                    {analysis.recommendations.products_recommended.map((product, index) => (
                                        <li key={index} className="text-purple-800 font-medium flex items-center gap-2">
                                          <Star className="text-purple-500" size={16} />
                                          {product}
                                        </li>
                                    ))}
                                  </ul>
                                </div>
                            )}

                            {/* Ingrédients */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {analysis.recommendations.ingredients_to_look_for.length > 0 && (
                                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                      <CheckCircle className="text-green-500" size={18} />
                                      Ingrédients à Rechercher
                                    </h4>
                                    <ul className="space-y-2">
                                      {analysis.recommendations.ingredients_to_look_for.map((ingredient, index) => (
                                          <li key={index} className="text-blue-800 font-medium">• {ingredient}</li>
                                      ))}
                                    </ul>
                                  </div>
                              )}

                              {analysis.recommendations.ingredients_to_avoid.length > 0 && (
                                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                      <X className="text-red-500" size={18} />
                                      Ingrédients à Éviter
                                    </h4>
                                    <ul className="space-y-2">
                                      {analysis.recommendations.ingredients_to_avoid.map((ingredient, index) => (
                                          <li key={index} className="text-red-800 font-medium">• {ingredient}</li>
                                      ))}
                                    </ul>
                                  </div>
                              )}
                            </div>

                            {/* Conseils lifestyle */}
                            {analysis.recommendations.lifestyle_tips.length > 0 && (
                                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                                  <h4 className="font-bold text-yellow-800 mb-4 text-lg flex items-center gap-2">
                                    <Activity className="text-yellow-600" size={18} />
                                    Conseils Lifestyle
                                  </h4>
                                  <ul className="space-y-2">
                                    {analysis.recommendations.lifestyle_tips.map((tip, index) => (
                                        <li key={index} className="text-yellow-800 font-medium">• {tip}</li>
                                    ))}
                                  </ul>
                                </div>
                            )}
                          </div>
                        </div>

                        {/* Consultation dermatologue */}
                        {analysis.recommendations.consult_dermatologist && (
                            <div className="mb-8">
                              <div className={`border rounded-xl p-6 ${getSeverityColor('high')}`}>
                                <div className="flex items-center gap-3">
                                  <AlertTriangle size={24} />
                                  <span className="font-bold text-lg">Consultation Dermatologue Recommandée</span>
                                </div>
                                <p className="text-sm mt-2">Des problèmes nécessitant un avis professionnel ont été détectés.</p>
                              </div>
                            </div>
                        )}

                        {/* Note de confiance */}
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                          <div className="flex items-start gap-3">
                            <Eye size={24} className="text-gray-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-lg font-bold text-gray-800 mb-2">Note sur l'Analyse IA</p>
                              <p className="text-gray-700 mb-3">{analysis.confidence_note}</p>
                              <p className="text-gray-700 mb-3">{analysis.recommendations.disclaimer}</p>
                              <p className="text-sm text-gray-500">
                                Analyse générée par CLIP (OpenAI) - Modèle vision-langage avancé
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                  ) : (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <Sparkles size={40} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                          Analyse SkinCare CLIP
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg">
                          Votre analyse personnalisée apparaîtra ici après avoir uploadé votre photo
                        </p>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-left border border-purple-200">
                          <h4 className="font-bold text-purple-800 mb-3">À propos de CLIP:</h4>
                          <ul className="text-purple-700 space-y-2">
                            <li className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-purple-500" />
                              Modèle vision-langage d'OpenAI
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-purple-500" />
                              Compréhension avancée images + texte
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-purple-500" />
                              Classification intelligente des types de peau
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-purple-500" />
                              Recommandations personnalisées précises
                            </li>
                          </ul>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer similaire à la page d'accueil */}
          <footer className="bg-gray-900 text-white py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="text-white" size={18} />
                  </div>
                  <span className="text-xl font-bold">SKINCARE AI</span>
                </div>
                <p className="text-gray-400 text-sm">
                  SkinCare AI v2.0 - Propulsé par OpenAI CLIP • Modèle: CLIP-ViT-B/32 (Vision Transformer)
                </p>
              </div>
            </div>
          </footer>
        </div>
    );
  };

  if (currentPage === 'analysis') {
    return <AnalysisApp />;
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100">
        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur-sm border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white" size={18} />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                SKINCARE AI
              </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    SKINCARE
                    <br/>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    To It's Finest
                  </span>
                  </h1>

                  <p className="text-lg text-gray-600 max-w-md">
                    Découvrez votre routine de soin personnalisée grâce à notre intelligence artificielle avancée.
                    Analysez votre peau et recevez des recommandations sur mesure.
                  </p>
                </div>

                <button
                    onClick={() => setCurrentPage('analysis')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-3 group ml-0"
                >
                  <Camera size={24}/>
                  Analyser ma peau maintenant
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </button>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Eye className="text-purple-600" size={24}/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Analyse IA</h3>
                      <p className="text-sm text-gray-600">CLIP Vision</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Shield className="text-pink-600" size={24}/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sécurisé</h3>
                      <p className="text-sm text-gray-600">Pas de stockage</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Heart className="text-blue-600" size={24}/>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Personnalisé</h3>
                      <p className="text-sm text-gray-600">Pour vous</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Image */}
              <div className="relative">
                <div className="relative z-10">
                  {/* Pot principal avec effet glassmorphism */}
                  <div className="w-80 h-80 mx-auto relative">
                    {/* Effets de lumière */}
                    <div className="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-full blur-2xl"></div>
                    <div className="absolute top-12 right-12 w-8 h-8 bg-purple-300/50 rounded-full blur-lg"></div>
                    <div className="absolute bottom-16 left-16 w-12 h-12 bg-pink-300/40 rounded-full blur-xl"></div>

                    {/* Pot principal */}
                    <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 rounded-full shadow-2xl relative overflow-hidden">
                      {/* Reflet */}
                      <div className="absolute top-8 left-8 w-32 h-32 bg-white/20 rounded-full blur-sm"></div>

                      {/* Couvercle */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"></div>
                    </div>

                    {/* Étoiles flottantes */}
                    <div className="absolute top-4 right-4">
                      <Star className="text-yellow-400 fill-current animate-pulse" size={24} />
                    </div>
                    <div className="absolute bottom-8 left-8">
                      <Star className="text-yellow-400 fill-current animate-pulse delay-700" size={16} />
                    </div>
                    <div className="absolute top-1/2 -right-4">
                      <Star className="text-yellow-400 fill-current animate-pulse delay-300" size={20} />
                    </div>
                  </div>
                </div>

                {/* Éléments de décoration flottants */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="absolute top-16 right-8 text-purple-300 animate-float">
                    <Sparkles size={28} />
                  </div>
                  <div className="absolute bottom-20 left-4 text-pink-300 animate-float delay-1000">
                    <Heart size={24} />
                  </div>
                  <div className="absolute top-1/3 left-8 text-blue-300 animate-float delay-500">
                    <Droplets size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Features Section */}
        <div className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Pourquoi choisir notre analyse IA ?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Notre technologie CLIP révolutionnaire analyse votre peau avec une précision inégalée
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-purple-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Search className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Analyse Précise</h3>
                <p className="text-gray-600">
                  Notre IA CLIP détecte avec précision votre type de peau et identifie les problèmes spécifiques
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span className="text-sm text-green-600">Précision > 90%</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-purple-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">100% Confidentiel</h3>
                <p className="text-gray-600">
                  Vos photos ne sont jamais stockées. Traitement en mémoire pour une confidentialité maximale
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span className="text-sm text-green-600">Zéro stockage</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-purple-100">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <Heart className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recommandations Sur Mesure</h3>
                <p className="text-gray-600">
                  Recevez une routine skincare personnalisée avec des produits adaptés à votre peau
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span className="text-sm text-green-600">Personnalisé à 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">50K+</div>
                <div className="text-purple-100">Analyses réalisées</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-purple-100">Précision IA</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-purple-100">Disponible</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">0</div>
                <div className="text-purple-100">Données stockées</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-br from-violet-50 to-pink-50">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Prêt à découvrir votre routine idéale ?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Commencez votre analyse gratuite dès maintenant et transformez votre routine skincare
            </p>
            <button
                onClick={() => setCurrentPage('analysis')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto group"
            >
              <Camera size={24} />
              Analyser ma peau maintenant
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="text-white" size={18} />
                  </div>
                  <span className="text-xl font-bold">SKINCARE AI</span>
                </div>
                <p className="text-gray-400 mb-4">
                  Votre assistant beauté intelligent pour une peau éclatante
                </p>
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                    <Heart size={18} />
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                    <Users size={18} />
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                    <Award size={18} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Produits</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Analyse IA</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Recommandations</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Routine personnalisée</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Suivi de peau</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contactez-nous</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation API</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Légal</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">RGPD</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 SkinCare AI. Tous droits réservés.
              </p>
              <p className="text-gray-400 text-sm mt-2 md:mt-0">
                Propulsé par OpenAI CLIP • Version 2.0
              </p>
            </div>
          </div>
        </footer>

        {/* Styles pour les animations */}
        <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      </div>
  );
};

export default App;