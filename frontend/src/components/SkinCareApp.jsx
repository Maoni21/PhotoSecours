import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Sparkles, AlertTriangle, Download, Activity, Shield, Clock, Eye, Search, Heart, Droplets, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SkinCareApp = () => {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [userName, setUserName] = useState('');
    const [error, setError] = useState(null);
    const [apiStatus, setApiStatus] = useState('checking');
    const fileInputRef = useRef(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-50';
        if (confidence >= 0.6) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
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
        <div className="min-h-screen bg-pink-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate('/')}
                        className="text-black hover:opacity-60 transition-opacity"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                            apiStatus === 'connected' ? 'bg-green-400' :
                                apiStatus === 'error' ? 'bg-red-400' :
                                    'bg-yellow-400'
                        }`}></div>
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <Sparkles className="text-white" size={24} />
                        </div>
                    </div>
                </div>

                <div className="mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-black leading-tight mb-6">
                        We Provide The Best.<br />
                        Skin Analysis Now!
                    </h1>
                </div>

                {error && (
                    <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-6 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-600" />
                            <span className="text-red-800 font-medium">Erreur</span>
                        </div>
                        <p className="text-red-700 mt-1">{error}</p>
                    </div>
                )}

                {!analysis ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

                            <div className="relative">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer group hover:shadow-xl transition-shadow aspect-square"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {imagePreview ? (
                                        <div className="relative h-full">
                                            <img
                                                src={imagePreview}
                                                alt="Votre peau"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Cliquez pour changer</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
                                            <div className="text-center">
                                                <Camera size={64} className="text-gray-400 mx-auto mb-6 group-hover:text-gray-600 transition-colors" />
                                                <p className="text-xl font-medium text-gray-700 mb-2">Uploadez votre photo</p>
                                                <p className="text-gray-500">JPG, PNG, WebP (max. 15MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col justify-center">
                                <h2 className="text-3xl md:text-4xl font-black text-black mb-6 leading-tight">
                                    Professional Makeup,<br />
                                    Beauty Products and<br />
                                    Beauty Treatments.<br />
                                    Affordable and Awesome
                                </h2>

                                <p className="text-gray-600 leading-relaxed mb-8 max-w-md">
                                    Notre IA analyse votre type de peau, détecte les problèmes et vous propose
                                    une routine skincare personnalisée avec des recommandations précises.
                                </p>

                                <div className="mb-8">
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        placeholder="Votre prénom (optionnel)"
                                        className="w-full max-w-md px-0 py-3 border-0 border-b border-gray-300 focus:border-black focus:outline-none text-lg bg-transparent placeholder-gray-400"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={analyzeImage}
                                        disabled={!selectedImage || isAnalyzing || apiStatus !== 'connected'}
                                        className={`flex items-center gap-2 font-medium transition-all ${
                                            !selectedImage || isAnalyzing || apiStatus !== 'connected'
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-black hover:gap-4'
                                        }`}
                                    >
                                        {isAnalyzing ? 'ANALYSE EN COURS...' : 'ANALYSER MAINTENANT'}
                                        {isAnalyzing ? (
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <ArrowRight size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

                            <div className="flex flex-col justify-center">
                                <h2 className="text-3xl md:text-4xl font-black text-black mb-6 leading-tight">
                                    Perfect Makeup and<br />
                                    Beauty Treatments<br />
                                    Await You
                                </h2>

                                <p className="text-gray-600 leading-relaxed mb-8 max-w-md">
                                    Analyse CLIP avancée avec modèle vision-langage pour une détection
                                    précise de votre type de peau et recommandations personnalisées.
                                </p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-gray-700">Détection du type de peau (grasse, sèche, mixte...)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-gray-700">Identification des problèmes cutanés</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                                        <span className="text-gray-700">Recommandations skincare personnalisées</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-black font-medium">
                                    <span>En savoir plus</span>
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white rounded-3xl p-6 shadow-lg">
                                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-300 rounded-2xl mb-4 flex items-center justify-center">
                                        <Droplets className="text-blue-600" size={32} />
                                    </div>
                                    <h3 className="font-bold text-black">Type de Peau</h3>
                                    <p className="text-sm text-gray-600">Détection IA précise</p>
                                </div>
                                <div className="bg-white rounded-3xl p-6 shadow-lg">
                                    <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-300 rounded-2xl mb-4 flex items-center justify-center">
                                        <Heart className="text-pink-600" size={32} />
                                    </div>
                                    <h3 className="font-bold text-black">Recommandations</h3>
                                    <p className="text-sm text-gray-600">Routine personnalisée</p>
                                </div>
                                <div className="bg-white rounded-3xl p-6 shadow-lg">
                                    <div className="aspect-square bg-gradient-to-br from-green-100 to-green-300 rounded-2xl mb-4 flex items-center justify-center">
                                        <Search className="text-green-600" size={32} />
                                    </div>
                                    <h3 className="font-bold text-black">Problèmes</h3>
                                    <p className="text-sm text-gray-600">Identification avancée</p>
                                </div>
                                <div className="bg-white rounded-3xl p-6 shadow-lg">
                                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-300 rounded-2xl mb-4 flex items-center justify-center">
                                        <Eye className="text-purple-600" size={32} />
                                    </div>
                                    <h3 className="font-bold text-black">CLIP AI</h3>
                                    <p className="text-sm text-gray-600">Vision-langage</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-16">

                        <div className="flex items-center justify-between">
                            <h2 className="text-4xl md:text-5xl font-black text-black">
                                Vos Résultats
                            </h2>
                            <button
                                onClick={downloadReport}
                                className="flex items-center gap-2 text-black font-medium hover:gap-4 transition-all"
                            >
                                TÉLÉCHARGER
                                <Download size={20} />
                            </button>
                        </div>

                        <div className="bg-purple-50 rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-purple-600" />
                                <span className="font-medium text-purple-800">Analyse CLIP</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-purple-600">Modèle:</span>
                                    <span className="ml-2 font-medium">CLIP-ViT-B/32</span>
                                </div>
                                <div>
                                    <span className="text-purple-600">ID:</span>
                                    <span className="ml-2 font-mono text-xs">{analysis.id}</span>
                                </div>
                                <div>
                                    <span className="text-purple-600">Date:</span>
                                    <span className="ml-2">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                            <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
                                <div className="aspect-square bg-gradient-to-br from-blue-400 to-blue-600 relative flex items-center justify-center">
                                    <Droplets className="text-white" size={48} />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl font-bold">Type de Peau</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-2xl font-black text-black capitalize mb-2">
                                        {analysis.skin_type.category}
                                    </p>
                                    <p className={`text-sm px-2 py-1 rounded-full inline-block ${getConfidenceColor(analysis.skin_type.confidence)}`}>
                                        {Math.round(analysis.skin_type.confidence * 100)}% confiance
                                    </p>

                                    {analysis.skin_type.all_scores && Object.keys(analysis.skin_type.all_scores).length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-blue-600 mb-2">Scores détaillés:</p>
                                            <div className="space-y-1">
                                                {Object.entries(analysis.skin_type.all_scores)
                                                    .sort(([,a], [,b]) => b - a)
                                                    .slice(0, 3)
                                                    .map(([type, score]) => (
                                                        <div key={type} className="flex justify-between text-xs">
                                                            <span className="text-blue-700 capitalize">{type}</span>
                                                            <span className="text-blue-600">{Math.round(score * 100)}%</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
                                <div className="aspect-square bg-gradient-to-br from-pink-400 to-pink-600 relative flex items-center justify-center">
                                    <Heart className="text-white" size={48} />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl font-bold">État de la Peau</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-2xl font-black text-black capitalize mb-2">
                                        {analysis.skin_condition.category}
                                    </p>
                                    <p className={`text-sm px-2 py-1 rounded-full inline-block ${getConfidenceColor(analysis.skin_condition.confidence)}`}>
                                        {Math.round(analysis.skin_condition.confidence * 100)}% confiance
                                    </p>
                                </div>
                            </div>

                            {/* Card Issues */}
                            <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
                                <div className="aspect-square bg-gradient-to-br from-orange-400 to-orange-600 relative flex items-center justify-center">
                                    <Search className="text-white" size={48} />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl font-bold">Problèmes Détectés</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-2xl font-black text-black mb-2">
                                        {analysis.problems_detected?.length || 0} détectés
                                    </p>
                                    <p className="text-gray-600 text-sm">Problèmes identifiés</p>

                                    {/* Liste complète des problèmes */}
                                    {analysis.problems_detected && analysis.problems_detected.length > 0 && (
                                        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                                            {analysis.problems_detected.map((problem, index) => (
                                                <div key={index} className="bg-orange-50 rounded-lg p-2">
                                                    <p className="font-medium text-orange-800 capitalize text-sm">{problem.condition}</p>
                                                    <p className="text-xs text-orange-600">
                                                        {Math.round(problem.confidence * 100)}% confiance
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                            <div className="flex flex-col justify-center">
                                <h2 className="text-3xl md:text-4xl font-black text-black mb-6 leading-tight">
                                    Votre Routine<br />
                                    Skincare Personnalisée<br />
                                    Commence Ici
                                </h2>

                                <p className="text-gray-600 leading-relaxed mb-8 max-w-md">
                                    Basé sur l'analyse IA CLIP, nous avons créé une routine sur mesure
                                    spécifiquement pour votre type de peau et vos préoccupations.
                                </p>

                                {/* Routine complète */}
                                <div className="bg-green-50 rounded-3xl p-8 mb-8">
                                    <h4 className="text-xl font-bold text-green-800 mb-6">Routine Quotidienne Complète</h4>
                                    <div className="space-y-4">
                                        {analysis.recommendations.routine_steps.map((step, index) => (
                                            <div key={index} className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="bg-white rounded-2xl p-4 flex-1">
                                                    <p className="text-green-700 font-medium">{step}</p>
                                                </div>
                                            </div>
                                        ))}
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
                            </div>

                            {/* Grid ingrédients et produits */}
                            <div className="space-y-6">
                                {/* Produits recommandés - Liste complète */}
                                {analysis.recommendations.products_recommended?.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-black mb-4">💄 Produits Recommandés</h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {analysis.recommendations.products_recommended.map((product, index) => (
                                                <p key={index} className="text-gray-600">• {product}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Ingrédients à rechercher */}
                                {analysis.recommendations.ingredients_to_look_for?.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-black mb-4">✓ Ingrédients à Rechercher</h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {analysis.recommendations.ingredients_to_look_for.map((ingredient, index) => (
                                                <p key={index} className="text-gray-600">• {ingredient}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Ingrédients à éviter */}
                                {analysis.recommendations.ingredients_to_avoid?.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-black mb-4">✗ Ingrédients à Éviter</h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {analysis.recommendations.ingredients_to_avoid.map((ingredient, index) => (
                                                <p key={index} className="text-gray-600">• {ingredient}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Conseils lifestyle */}
                                {analysis.recommendations.lifestyle_tips?.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-black mb-4">💡 Conseils Lifestyle</h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {analysis.recommendations.lifestyle_tips.map((tip, index) => (
                                                <p key={index} className="text-gray-600">• {tip}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-12 shadow-lg">
                            <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Sparkles size={64} className="mx-auto mb-4" />
                                    <p className="text-xl font-bold">IA CLIP</p>
                                    <p className="text-sm opacity-80">Vision + Langage</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <blockquote className="text-2xl md:text-3xl text-gray-800 mb-6 leading-relaxed">
                                    "{analysis.confidence_note || 'Cette analyse IA m\'a aidé à mieux comprendre ma peau que jamais auparavant.'}"
                                </blockquote>
                                <div>
                                    <p className="text-2xl font-black text-black">{userName || 'Utilisateur'}</p>
                                    <p className="text-gray-600">Analyse vérifiée</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-3xl p-8">
                            <div className="flex items-start gap-4">
                                <Eye size={24} className="text-gray-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-lg font-medium text-gray-800 mb-3">Note sur l'Analyse IA</p>
                                    <p className="text-gray-700 mb-4">{analysis.confidence_note}</p>
                                    <p className="text-gray-700 mb-4">{analysis.recommendations.disclaimer}</p>
                                    <div className="bg-white rounded-2xl p-4">
                                        <p className="text-sm text-gray-600">
                                            <strong>Technologie utilisée :</strong> CLIP (OpenAI) - Modèle vision-langage avancé<br/>
                                            <strong>Modèle :</strong> CLIP-ViT-B/32 (Vision Transformer)<br/>
                                            <strong>Capacités :</strong> Classification des types de peau, détection de problèmes, recommandations personnalisées
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => {
                                    setAnalysis(null);
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                    setUserName('');
                                    setError(null);
                                }}
                                className="flex items-center gap-2 text-black font-medium hover:gap-4 transition-all mx-auto"
                            >
                                NOUVELLE ANALYSE
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-16 text-center text-sm text-gray-500">
                    <p>
                        SkinCare AI v1.0 - Propulsé par OpenAI CLIP
                        <span className="ml-2">| Modèle: CLIP-ViT-B/32 (Vision Transformer)</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SkinCareApp;