/** Local WASM matching the installed @mediapipe/tasks-vision version. */
export const MEDIAPIPE_WASM_PATH = "/mediapipe/wasm";

/** Bundled Face Landmarker task file (hosted locally — Google’s old .tflite URL 404s). */
export const FACE_LANDMARKER_MODEL = "/mediapipe/models/face_landmarker.task";

/** Fallback model URLs if the local copy is missing. */
export const FACE_LANDMARKER_MODEL_CANDIDATES = [
  FACE_LANDMARKER_MODEL,
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
  "https://github.com/sanderdesnaijer/mediapipe-model-mirrors/releases/download/v1/face_landmarker.task",
];

/** Try local first, then CDN mirrors that match common package versions. */
export const MEDIAPIPE_WASM_CANDIDATES = [
  MEDIAPIPE_WASM_PATH,
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
];
