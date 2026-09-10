export interface StructuredErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export class GeminiQuotaExceededError extends Error {
  public readonly code = 'GEMINI_QUOTA_EXCEEDED';
  public readonly status = 429;

  constructor(
    message = 'Gemini API quota has been reached. Please try again later or check your Gemini API quota.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'GeminiQuotaExceededError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class GeminiServiceUnavailableError extends Error {
  public readonly code = 'GEMINI_UNAVAILABLE';
  public readonly status = 503;

  constructor(
    message = 'The AI service is temporarily experiencing high demand. Please try again shortly.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'GeminiServiceUnavailableError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class VisionError extends Error {
  public readonly code = 'VISION_ERROR';
  public readonly status = 502;

  constructor(
    message = 'Failed to process document image with Google Cloud Vision OCR.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'VisionError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class OcrEmptyError extends Error {
  public readonly code = 'OCR_EMPTY';
  public readonly status = 422;

  constructor(
    message = 'No legible text or medical prescriptions were detected in this image. Please upload a clearer photo or enter details manually.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'OcrEmptyError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class InvalidImageError extends Error {
  public readonly code = 'INVALID_IMAGE';
  public readonly status = 400;

  constructor(
    message = 'Invalid image format or corrupted file provided. Please provide a clear JPEG, PNG, or WebP image.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'InvalidImageError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class InvalidGeminiResponseError extends Error {
  public readonly code = 'INVALID_GEMINI_RESPONSE';
  public readonly status = 502;

  constructor(
    message = 'AI model generated an incomplete or invalid response format. Falling back to clinical extraction.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'InvalidGeminiResponseError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ServerError extends Error {
  public readonly code = 'SERVER_ERROR';
  public readonly status = 500;

  constructor(
    message = 'An unexpected internal error occurred while analyzing the prescription.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ServerError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class PrescriptionExtractionFailedError extends Error {
  public readonly code = 'PRESCRIPTION_EXTRACTION_FAILED';
  public readonly status = 422;

  constructor(
    message = 'No medicine information could be reliably extracted from this prescription.',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PrescriptionExtractionFailedError';
  }

  toJSON(): StructuredErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// Backward compatibility alias
export const VisionOcrError = VisionError;

