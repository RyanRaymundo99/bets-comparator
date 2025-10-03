// Image Analysis Library for Document Fraud Detection
// This library provides various analysis functions to detect document falsification

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

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Analyze a single image for fraud indicators
export async function analyzeImage(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  // Return default result if not in browser
  if (!isBrowser) {
    return getDefaultAnalysisResult();
  }

  try {
    // Create a canvas to analyze the image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve(getDefaultAnalysisResult());
          return;
        }

        const analysis = performImageAnalysis(imageData);
        resolve(analysis);
      };

      img.onerror = () => {
        resolve(getDefaultAnalysisResult());
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return getDefaultAnalysisResult();
  }
}

// Perform detailed image analysis
function performImageAnalysis(imageData: ImageData): ImageAnalysisResult {
  const { data, width, height } = imageData;
  const issues: string[] = [];
  const fraudIndicators = {
    suspiciousEdges: false,
    inconsistentLighting: false,
    lowQuality: false,
    possiblePhotoshop: false,
    textInconsistencies: false,
  };

  // Calculate basic image metrics
  const brightness = calculateBrightness(data);
  const contrast = calculateContrast(data);
  const sharpness = calculateSharpness(data, width, height);
  const colorVariance = calculateColorVariance(data);
  const edgeDensity = calculateEdgeDensity(data, width, height);

  // Fraud detection algorithms
  if (brightness < 0.2 || brightness > 0.8) {
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

  if (colorVariance < 0.1) {
    issues.push("Unusually low color variance - possible digital manipulation");
    fraudIndicators.possiblePhotoshop = true;
  }

  if (edgeDensity < 0.1 || edgeDensity > 0.9) {
    issues.push("Abnormal edge density detected");
    fraudIndicators.suspiciousEdges = true;
  }

  // Check for common photoshop artifacts
  if (detectPhotoshopArtifacts(data, width, height)) {
    issues.push("Possible digital editing artifacts detected");
    fraudIndicators.possiblePhotoshop = true;
  }

  // Check for text consistency (basic OCR simulation)
  if (detectTextInconsistencies(data, width, height)) {
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

// Calculate image brightness
function calculateBrightness(data: Uint8ClampedArray): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += (r + g + b) / 3;
  }
  return sum / (data.length / 4) / 255;
}

// Calculate image contrast
function calculateContrast(data: Uint8ClampedArray): number {
  let sum = 0;
  let sumSquares = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += gray;
    sumSquares += gray * gray;
  }

  const mean = sum / pixelCount;
  const variance = sumSquares / pixelCount - mean * mean;
  return Math.sqrt(variance) / 255;
}

// Calculate image sharpness using Laplacian variance
function calculateSharpness(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let laplacianSum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Laplacian kernel
      const top =
        (data[((y - 1) * width + x) * 4] +
          data[((y - 1) * width + x) * 4 + 1] +
          data[((y - 1) * width + x) * 4 + 2]) /
        3;
      const bottom =
        (data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + x) * 4 + 1] +
          data[((y + 1) * width + x) * 4 + 2]) /
        3;
      const left =
        (data[(y * width + (x - 1)) * 4] +
          data[(y * width + (x - 1)) * 4 + 1] +
          data[(y * width + (x - 1)) * 4 + 2]) /
        3;
      const right =
        (data[(y * width + (x + 1)) * 4] +
          data[(y * width + (x + 1)) * 4 + 1] +
          data[(y * width + (x + 1)) * 4 + 2]) /
        3;

      const laplacian = Math.abs(4 * gray - top - bottom - left - right);
      laplacianSum += laplacian;
      count++;
    }
  }

  return laplacianSum / count / 255;
}

// Calculate color variance
function calculateColorVariance(data: Uint8ClampedArray): number {
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  let rSumSquares = 0,
    gSumSquares = 0,
    bSumSquares = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rSum += r;
    gSum += g;
    bSum += b;

    rSumSquares += r * r;
    gSumSquares += g * g;
    bSumSquares += b * b;
  }

  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;

  const rVariance = rSumSquares / pixelCount - rMean * rMean;
  const gVariance = gSumSquares / pixelCount - gMean * gMean;
  const bVariance = bSumSquares / pixelCount - bMean * bMean;

  return (rVariance + gVariance + bVariance) / 3 / (255 * 255);
}

// Calculate edge density
function calculateEdgeDensity(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let edgeCount = 0;
  let totalPixels = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const top =
        (data[((y - 1) * width + x) * 4] +
          data[((y - 1) * width + x) * 4 + 1] +
          data[((y - 1) * width + x) * 4 + 2]) /
        3;
      const bottom =
        (data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + x) * 4 + 1] +
          data[((y + 1) * width + x) * 4 + 2]) /
        3;
      const left =
        (data[(y * width + (x - 1)) * 4] +
          data[(y * width + (x - 1)) * 4 + 1] +
          data[(y * width + (x - 1)) * 4 + 2]) /
        3;
      const right =
        (data[(y * width + (x + 1)) * 4] +
          data[(y * width + (x + 1)) * 4 + 1] +
          data[(y * width + (x + 1)) * 4 + 2]) /
        3;

      const gradient = Math.sqrt(
        Math.pow(right - left, 2) + Math.pow(bottom - top, 2)
      );

      if (gradient > 30) {
        // Threshold for edge detection
        edgeCount++;
      }
      totalPixels++;
    }
  }

  return edgeCount / totalPixels;
}

// Detect common photoshop artifacts
function detectPhotoshopArtifacts(
  data: Uint8ClampedArray,
  width: number,
  height: number
): boolean {
  // Check for JPEG compression artifacts
  let artifactCount = 0;
  const blockSize = 8;

  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      if (hasCompressionArtifacts(data, x, y, blockSize, width)) {
        artifactCount++;
      }
    }
  }

  return artifactCount > ((width * height) / (blockSize * blockSize)) * 0.1;
}

// Check for compression artifacts in a block
function hasCompressionArtifacts(
  data: Uint8ClampedArray,
  startX: number,
  startY: number,
  blockSize: number,
  width: number
): boolean {
  let maxDiff = 0;

  for (let y = startY; y < startY + blockSize - 1; y++) {
    for (let x = startX; x < startX + blockSize - 1; x++) {
      const idx1 = (y * width + x) * 4;
      const idx2 = (y * width + (x + 1)) * 4;
      const idx3 = ((y + 1) * width + x) * 4;

      const gray1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
      const gray2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
      const gray3 = (data[idx3] + data[idx3 + 1] + data[idx3 + 2]) / 3;

      const diff1 = Math.abs(gray1 - gray2);
      const diff2 = Math.abs(gray1 - gray3);

      maxDiff = Math.max(maxDiff, diff1, diff2);
    }
  }

  return maxDiff > 50; // Threshold for compression artifacts
}

// Detect text inconsistencies (simplified)
function detectTextInconsistencies(
  data: Uint8ClampedArray,
  width: number,
  height: number
): boolean {
  // This is a simplified check - in a real implementation, you'd use OCR
  let textRegions = 0;
  let inconsistentRegions = 0;

  // Sample every 10th pixel for performance
  for (let y = 0; y < height; y += 10) {
    for (let x = 0; x < width; x += 10) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Simple text detection based on color patterns
      if (gray < 100 || gray > 200) {
        textRegions++;

        // Check for inconsistencies in text regions
        if (hasTextInconsistency(data, x, y, width, height)) {
          inconsistentRegions++;
        }
      }
    }
  }

  return textRegions > 0 && inconsistentRegions / textRegions > 0.3;
}

// Check for text inconsistency in a region
function hasTextInconsistency(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const regionSize = 20;
  let colorVariance = 0;
  let pixelCount = 0;

  for (let dy = 0; dy < regionSize && y + dy < height; dy++) {
    for (let dx = 0; dx < regionSize && x + dx < width; dx++) {
      const idx = ((y + dy) * width + (x + dx)) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      colorVariance += gray;
      pixelCount++;
    }
  }

  const avgGray = colorVariance / pixelCount;
  let variance = 0;

  for (let dy = 0; dy < regionSize && y + dy < height; dy++) {
    for (let dx = 0; dx < regionSize && x + dx < width; dx++) {
      const idx = ((y + dy) * width + (x + dx)) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      variance += Math.pow(gray - avgGray, 2);
    }
  }

  return variance / pixelCount > 1000; // High variance indicates inconsistency
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
