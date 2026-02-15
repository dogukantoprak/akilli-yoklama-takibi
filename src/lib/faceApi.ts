import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

const MODEL_URL = '/models';

let loadPromise: Promise<void> | null = null;

export async function loadFaceApiModels() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const backend = tf.getBackend();
      if (!backend) {
        try {
          await tf.setBackend('webgl');
        } catch (_error) {
          await tf.setBackend('cpu');
        }
      }
      await tf.ready();

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    })();
  }
  return loadPromise;
}

export const FaceApi = faceapi;
