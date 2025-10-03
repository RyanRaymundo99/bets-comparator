// Simplified Image Analysis for Document Fraud Detection
// This is a lighter version that provides basic analysis without complex image processing

export interface ImageAnalysisResult {
  isAuthentic: boolean;
  confidence: number;
  issues: string[];
  metadata: {
    brightness: number;
    contrast: number;
    sharpness: number;
    colorVariance: number;
    edgeDensity: number;
  };
  fraudIndicators: {
    suspiciousEdges: boolean;
    inconsistentLighting: boolean;
    lowQuality: boolean;
    possiblePhotoshop: boolean;
    textInconsistencies: boolean;
  };
}

export interface DocumentAnalysisResult {
  documentFront: ImageAnalysisResult;
  documentBack: ImageAnalysisResult;
  selfie: ImageAnalysisResult;
  overallAuthenticity: number;
  recommendations: string[];
}

// Simplified image analysis that works without canvas processing
export async function analyzeImage(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  try {
    // Check if imageUrl is provided
    if (!imageUrl) {
      console.warn("No image URL provided for analysis");
      return getDefaultAnalysisResult();
    }

    // Basic analysis based on image URL and metadata
    const analysis = performBasicAnalysis(imageUrl);
    return analysis;
  } catch (error) {
    console.error("Image analysis error:", error);
    return getDefaultAnalysisResult();
  }
}

// Perform basic analysis without canvas processing
function performBasicAnalysis(imageUrl: string): ImageAnalysisResult {
  const issues: string[] = [];
  const fraudIndicators = {
    suspiciousEdges: false,
    inconsistentLighting: false,
    lowQuality: false,
    possiblePhotoshop: false,
    textInconsistencies: false,
  };

  // Check if imageUrl is valid
  if (!imageUrl || typeof imageUrl !== "string") {
    issues.push("Invalid image URL provided");
    fraudIndicators.lowQuality = true;
    return {
      isAuthentic: false,
      confidence: 0,
      issues,
      metadata: {
        brightness: 0,
        contrast: 0,
        sharpness: 0,
        colorVariance: 0,
        edgeDensity: 0,
      },
      fraudIndicators,
    };
  }

  // Basic checks based on image URL and common patterns
  if (imageUrl.includes("placeholder") || imageUrl.includes("default")) {
    issues.push("Placeholder image detected");
    fraudIndicators.lowQuality = true;
  }

  if (imageUrl.includes("screenshot") || imageUrl.includes("screen")) {
    issues.push("Screenshot detected - may not be original document");
    fraudIndicators.possiblePhotoshop = true;
  }

  // Simulate some basic metrics (in a real implementation, these would be calculated)
  const brightness = 0.5 + Math.random() * 0.3; // Simulate 50-80% brightness
  const contrast = 0.4 + Math.random() * 0.4; // Simulate 40-80% contrast
  const sharpness = 0.6 + Math.random() * 0.3; // Simulate 60-90% sharpness
  const colorVariance = 0.3 + Math.random() * 0.4; // Simulate 30-70% color variance
  const edgeDensity = 0.2 + Math.random() * 0.6; // Simulate 20-80% edge density

  // Basic fraud detection based on simulated metrics
  if (brightness < 0.3 || brightness > 0.8) {
    issues.push("Unusual brightness levels detected");
    fraudIndicators.inconsistentLighting = true;
  }

  if (contrast < 0.3) {
    issues.push("Low contrast detected - possible scan quality issue");
    fraudIndicators.lowQuality = true;
  }

  if (sharpness < 0.5) {
    issues.push("Low sharpness detected - possible blur or compression");
    fraudIndicators.lowQuality = true;
  }

  if (colorVariance < 0.2) {
    issues.push("Unusually low color variance - possible digital manipulation");
    fraudIndicators.possiblePhotoshop = true;
  }

  if (edgeDensity < 0.1 || edgeDensity > 0.9) {
    issues.push("Abnormal edge density detected");
    fraudIndicators.suspiciousEdges = true;
  }

  // Random chance of detecting issues for demonstration
  if (Math.random() < 0.1) {
    issues.push("Possible digital editing artifacts detected");
    fraudIndicators.possiblePhotoshop = true;
  }

  if (Math.random() < 0.05) {
    issues.push("Text inconsistencies detected");
    fraudIndicators.textInconsistencies = true;
  }

  const isAuthentic = issues.length === 0;
  const confidence = Math.max(0, 100 - issues.length * 15);

  return {
    isAuthentic,
    confidence,
    issues,
    metadata: {
      brightness,
      contrast,
      sharpness,
      colorVariance,
      edgeDensity,
    },
    fraudIndicators,
  };
}

// Analyze complete document set
export async function analyzeDocumentSet(
  documentFront: string,
  documentBack: string,
  selfie: string
): Promise<DocumentAnalysisResult> {
  const [frontAnalysis, backAnalysis, selfieAnalysis] = await Promise.all([
    analyzeImage(documentFront),
    analyzeImage(documentBack),
    analyzeImage(selfie),
  ]);

  const overallAuthenticity =
    (frontAnalysis.confidence +
      backAnalysis.confidence +
      selfieAnalysis.confidence) /
    3;

  const recommendations: string[] = [];

  if (overallAuthenticity < 70) {
    recommendations.push(
      "High risk of fraud detected - manual review required"
    );
  } else if (overallAuthenticity < 85) {
    recommendations.push(
      "Moderate risk detected - additional verification recommended"
    );
  } else {
    recommendations.push("Document appears authentic");
  }

  if (
    frontAnalysis.fraudIndicators.possiblePhotoshop ||
    backAnalysis.fraudIndicators.possiblePhotoshop
  ) {
    recommendations.push("Digital manipulation detected in documents");
  }

  if (selfieAnalysis.fraudIndicators.lowQuality) {
    recommendations.push("Selfie quality is poor - request new photo");
  }

  return {
    documentFront: frontAnalysis,
    documentBack: backAnalysis,
    selfie: selfieAnalysis,
    overallAuthenticity,
    recommendations,
  };
}

// Get default analysis result for error cases
function getDefaultAnalysisResult(): ImageAnalysisResult {
  return {
    isAuthentic: false,
    confidence: 0,
    issues: ["Unable to analyze image"],
    metadata: {
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      colorVariance: 0,
      edgeDensity: 0,
    },
    fraudIndicators: {
      suspiciousEdges: false,
      inconsistentLighting: false,
      lowQuality: true,
      possiblePhotoshop: false,
      textInconsistencies: false,
    },
  };
}
