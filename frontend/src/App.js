import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Sparkles, AlertTriangle, Download, Activity, Shield, Clock, Eye, Search, Heart, Droplets } from 'lucide-react';

const SkinCareApp = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
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

  // Fonction pour traiter l'upload d'image
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (15MB max pour skincare)
      if (file.size > 15 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximale: 15MB');
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide (JPG, PNG, etc.)');
        return;
      }

      setSelectedImage(file);
      setError(null);

      // Créer un preview de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Reset l'analyse précédente
      setAnalysis(null);
    }
  };

  // Fonction pour analyser l'image avec CLIP
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
        // Gérer les erreurs de validation de visage
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
      metadata: {
        model_used: 'CLIP Vision-Language Model',
        processing_capabilities: ['Skin Type Classification', 'Problem Detection', 'Condition Assessment'],
        ai_technology: 'OpenAI CLIP'
      },
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

  // Fonction pour formater la confiance
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Fonction pour formater la sévérité
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
      <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen">
        {/* Header avec statut API */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="text-pink-600" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              SkinCare AI
            </h1>
          </div>
          <p className="text-gray-600 mb-2">
            Analyse intelligente de peau et recommandations personnalisées avec CLIP
          </p>

          {/* Statut API */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              apiStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  apiStatus === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-500' :
                    apiStatus === 'error' ? 'bg-red-500' :
                        'bg-yellow-500'
            }`}></div>
            API {apiStatus === 'connected' ? 'Connectée' : apiStatus === 'error' ? 'Déconnectée' : 'Vérification...'}
            <span className="ml-2 text-xs">(CLIP-ViT-B/32)</span>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <span className="text-red-800 font-medium">Erreur</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
        )}

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Camera size={20} />
                Photo de votre peau
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 transition-colors">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />

                {imagePreview ? (
                    <div className="space-y-4">
                      <img
                          src={imagePreview}
                          alt="Image sélectionnée"
                          className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-lg"
                      />
                      <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                      >
                        <Upload size={20} />
                        Changer d'image
                      </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer space-y-4"
                    >
                      <div className="flex justify-center">
                        <Camera size={48} className="text-gray-400" />
                      </div>
                      <p className="text-xl font-medium text-gray-600">
                        Cliquez pour uploader une photo de votre visage
                      </p>
                      <p className="text-sm text-gray-500">
                        Formats: JPG, PNG, WebP (max. 15MB)<br/>
                        Éclairage naturel recommandé, sans maquillage
                      </p>
                    </div>
                )}
              </div>
            </div>

            {/* Informations utilisateur */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations</h3>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre prénom (optionnel)
              </label>
              <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ex: Sarah, Alex..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Capacités CLIP */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Eye size={20} className="text-purple-600" />
                Analyse CLIP Avancée
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Droplets size={16} className="text-blue-500" />
                  <span>Détection du type de peau (grasse, sèche, mixte...)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Search size={16} className="text-green-500" />
                  <span>Identification des problèmes cutanés</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Heart size={16} className="text-pink-500" />
                  <span>Recommandations skincare personnalisées</span>
                </div>
              </div>
            </div>

            {/* Bouton d'analyse */}
            <button
                onClick={analyzeImage}
                disabled={!selectedImage || isAnalyzing || apiStatus !== 'connected'}
                className={`w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    !selectedImage || isAnalyzing || apiStatus !== 'connected'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
            >
              {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyse CLIP en cours...
                  </>
              ) : (
                  <>
                    <Sparkles size={20} />
                    Analyser ma peau avec CLIP
                  </>
              )}
            </button>
          </div>

          {/* Section Résultats */}
          <div className="space-y-6">
            {analysis ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Shield size={24} className="text-pink-600" />
                      Analyse SkinCare
                    </h2>
                    <button
                        onClick={downloadReport}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Download size={16} />
                      Télécharger
                    </button>
                  </div>

                  {/* Métadonnées de l'analyse */}
                  <div className="bg-purple-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-purple-600" />
                      <span className="font-medium text-purple-800">Analyse CLIP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-600">Modèle:</span>
                        <span className="ml-2 font-medium">CLIP-ViT-B/32</span>
                      </div>
                      <div>
                        <span className="text-purple-600">ID:</span>
                        <span className="ml-2 font-mono text-xs">{analysis.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Type de peau */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Droplets size={18} className="text-blue-500" />
                      Type de Peau Détecté
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-xl font-bold text-blue-800 capitalize">
                                            {analysis.skin_type.category}
                                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysis.skin_type.confidence)}`}>
                                            {Math.round(analysis.skin_type.confidence * 100)}% confiance
                                        </span>
                      </div>
                      {analysis.skin_type.all_scores && Object.keys(analysis.skin_type.all_scores).length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-blue-600 mb-2">Scores détaillés:</p>
                            <div className="space-y-1">
                              {Object.entries(analysis.skin_type.all_scores)
                                  .sort(([,a], [,b]) => b - a)
                                  .map(([type, score]) => (
                                      <div key={type} className="flex justify-between text-sm">
                                        <span className="text-blue-700 capitalize">{type}</span>
                                        <span className="text-blue-600">{Math.round(score * 100)}%</span>
                                      </div>
                                  ))}
                            </div>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Problèmes détectés */}
                  {analysis.problems_detected && analysis.problems_detected.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Search size={18} className="text-orange-500" />
                          Problèmes Détectés
                        </h3>
                        <div className="space-y-3">
                          {analysis.problems_detected.map((problem, index) => (
                              <div key={index} className="bg-orange-50 rounded-lg p-3">
                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-orange-800 capitalize">
                                                        {problem.condition}
                                                    </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(problem.confidence)}`}>
                                                        {Math.round(problem.confidence * 100)}%
                                                    </span>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* État de la peau */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Heart size={18} className="text-pink-500" />
                      État de la Peau
                    </h3>
                    <div className="bg-pink-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-pink-800 capitalize">
                                            {analysis.skin_condition.category}
                                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysis.skin_condition.confidence)}`}>
                                            {Math.round(analysis.skin_condition.confidence * 100)}% confiance
                                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommandations */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Routine Skincare Personnalisée</h3>
                    <div className="space-y-4">
                      {/* Étapes de routine */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">Routine Quotidienne</h4>
                        <ul className="space-y-2">
                          {analysis.recommendations.routine_steps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2">
                                                    <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                <span className="text-green-700 text-sm">{step}</span>
                              </li>
                          ))}
                        </ul>
                      </div>

                      {/* Produits recommandés */}
                      {analysis.recommendations.products_recommended.length > 0 && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h4 className="font-medium text-purple-800 mb-2">Produits Recommandés</h4>
                            <ul className="space-y-1">
                              {analysis.recommendations.products_recommended.map((product, index) => (
                                  <li key={index} className="text-purple-700 text-sm">• {product}</li>
                              ))}
                            </ul>
                          </div>
                      )}

                      {/* Ingrédients */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.recommendations.ingredients_to_look_for.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-medium text-blue-800 mb-2">✅ Ingrédients à Rechercher</h4>
                              <ul className="space-y-1">
                                {analysis.recommendations.ingredients_to_look_for.map((ingredient, index) => (
                                    <li key={index} className="text-blue-700 text-sm">• {ingredient}</li>
                                ))}
                              </ul>
                            </div>
                        )}

                        {analysis.recommendations.ingredients_to_avoid.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-4">
                              <h4 className="font-medium text-red-800 mb-2">❌ Ingrédients à Éviter</h4>
                              <ul className="space-y-1">
                                {analysis.recommendations.ingredients_to_avoid.map((ingredient, index) => (
                                    <li key={index} className="text-red-700 text-sm">• {ingredient}</li>
                                ))}
                              </ul>
                            </div>
                        )}
                      </div>

                      {/* Conseils lifestyle */}
                      {analysis.recommendations.lifestyle_tips.length > 0 && (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-800 mb-2">💡 Conseils Lifestyle</h4>
                            <ul className="space-y-1">
                              {analysis.recommendations.lifestyle_tips.map((tip, index) => (
                                  <li key={index} className="text-yellow-700 text-sm">• {tip}</li>
                              ))}
                            </ul>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Consultation dermatologue */}
                  {analysis.recommendations.consult_dermatologist && (
                      <div className="mb-6">
                        <div className={`border rounded-lg p-4 ${getSeverityColor('high')}`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={20} />
                            <span className="font-bold">Consultation Dermatologue Recommandée</span>
                          </div>
                          <p className="text-sm mt-1">Des problèmes nécessitant un avis professionnel ont été détectés.</p>
                        </div>
                      </div>
                  )}

                  {/* Note de confiance */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Eye size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-1">Note sur l'Analyse IA</p>
                        <p className="text-sm text-gray-700">{analysis.confidence_note}</p>
                        <p className="text-sm text-gray-700 mt-2">{analysis.recommendations.disclaimer}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Analyse générée par CLIP (OpenAI) - Modèle vision-langage avancé
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <Sparkles size={48} className="text-pink-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Analyse SkinCare CLIP
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Votre analyse personnalisée apparaîtra ici après avoir uploadé votre photo
                  </p>
                  <div className="bg-pink-50 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-pink-800 mb-2">À propos de CLIP:</h4>
                    <ul className="text-sm text-pink-700 space-y-1">
                      <li>• Modèle vision-langage d'OpenAI</li>
                      <li>• Compréhension avancée images + texte</li>
                      <li>• Classification intelligente des types de peau</li>
                      <li>• Recommandations personnalisées précises</li>
                    </ul>
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            SkinCare AI v1.0 - Propulsé par OpenAI CLIP
            <span className="ml-2">| Modèle: CLIP-ViT-B/32 (Vision Transformer)</span>
          </p>
        </div>
      </div>
  );
};

export default SkinCareApp;