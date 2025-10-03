"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Zap,
  Palette,
  Scissors,
  Type,
  Loader2,
} from "lucide-react";
import {
  ImageAnalysisResult,
  DocumentAnalysisResult,
} from "@/lib/simple-image-analysis";

interface ImageAnalysisPanelProps {
  documentFront: string;
  documentBack: string;
  selfie: string;
  onAnalysisComplete?: (result: DocumentAnalysisResult) => void;
}

const ImageAnalysisPanel: React.FC<ImageAnalysisPanelProps> = ({
  documentFront,
  documentBack,
  selfie,
  onAnalysisComplete,
}) => {
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if we're in browser environment
      if (typeof window === "undefined") {
        setError("Image analysis requires browser environment");
        return;
      }

      // Check if all required images are provided
      if (!documentFront || !documentBack || !selfie) {
        setError("All document images and selfie are required for analysis");
        return;
      }

      const { analyzeDocumentSet } = await import(
        "@/lib/simple-image-analysis"
      );
      const result = await analyzeDocumentSet(
        documentFront,
        documentBack,
        selfie
      );
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError("Failed to analyze images");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  }, [documentFront, documentBack, selfie, onAnalysisComplete]);

  useEffect(() => {
    analyzeImages();
  }, [documentFront, documentBack, selfie, analyzeImages]);

  const getAuthenticityColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-400";
    if (confidence >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getAuthenticityBadge = (confidence: number) => {
    if (confidence >= 85) {
      return <Badge className="bg-green-600 text-white">Authentic</Badge>;
    }
    if (confidence >= 70) {
      return <Badge className="bg-yellow-600 text-white">Suspicious</Badge>;
    }
    return <Badge className="bg-red-600 text-white">Fraudulent</Badge>;
  };

  const renderImageAnalysis = (title: string, result: ImageAnalysisResult) => (
    <Card className="bg-gray-700 border-gray-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          {title}
          {getAuthenticityBadge(result.confidence)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Confidence</span>
          <span
            className={`font-medium ${getAuthenticityColor(result.confidence)}`}
          >
            {result.confidence.toFixed(1)}%
          </span>
        </div>

        <Progress value={result.confidence} className="h-2" />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">Brightness</span>
            <span className="text-white">
              {(result.metadata.brightness * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Palette className="w-3 h-3 text-purple-400" />
            <span className="text-gray-400">Contrast</span>
            <span className="text-white">
              {(result.metadata.contrast * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Scissors className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Sharpness</span>
            <span className="text-white">
              {(result.metadata.sharpness * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Type className="w-3 h-3 text-orange-400" />
            <span className="text-gray-400">Edges</span>
            <span className="text-white">
              {(result.metadata.edgeDensity * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {result.issues.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">Issues Detected</span>
            </div>
            {result.issues.map((issue, index) => (
              <div key={index} className="text-red-300 text-xs pl-4">
                • {issue}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 text-xs">
          {result.fraudIndicators.suspiciousEdges && (
            <div className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" />
              <span>Suspicious Edges</span>
            </div>
          )}
          {result.fraudIndicators.inconsistentLighting && (
            <div className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" />
              <span>Lighting Issues</span>
            </div>
          )}
          {result.fraudIndicators.lowQuality && (
            <div className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Low Quality</span>
            </div>
          )}
          {result.fraudIndicators.possiblePhotoshop && (
            <div className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" />
              <span>Digital Editing</span>
            </div>
          )}
          {result.fraudIndicators.textInconsistencies && (
            <div className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" />
              <span>Text Issues</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">
            Analyzing images for fraud detection...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="p-6 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={analyzeImages} variant="outline" size="sm">
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overall Analysis Summary */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Fraud Detection Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Overall Authenticity</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${getAuthenticityColor(
                  analysis.overallAuthenticity
                )}`}
              >
                {analysis.overallAuthenticity.toFixed(1)}%
              </span>
              {getAuthenticityBadge(analysis.overallAuthenticity)}
            </div>
          </div>

          <Progress value={analysis.overallAuthenticity} className="h-3" />

          <div className="space-y-2">
            <h4 className="text-white font-medium">Recommendations</h4>
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {rec.includes("High risk") || rec.includes("fraud") ? (
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                ) : rec.includes("Moderate") ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-gray-300">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Image Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderImageAnalysis("Document Front", analysis.documentFront)}
        {renderImageAnalysis("Document Back", analysis.documentBack)}
        {renderImageAnalysis("Selfie", analysis.selfie)}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={analyzeImages} variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Re-analyze
        </Button>
      </div>
    </div>
  );
};

export default ImageAnalysisPanel;
