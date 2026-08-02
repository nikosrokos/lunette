/** Local WASM matching the installed @mediapipe/tasks-vision version. */
export const MEDIAPIPE_WASM_PATH = "/mediapipe/wasm";

export const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.tflite";

/** Try local first, then CDN mirrors that match common package versions. */
export const MEDIAPIPE_WASM_CANDIDATES = [
  MEDIAPIPE_WASM_PATH,
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
];
