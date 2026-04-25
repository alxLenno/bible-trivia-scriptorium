#!/bin/bash


add_env() {
  echo "Adding $1..."
  vercel env add "$1" production --value "$2" --yes
  vercel env add "$1" preview --value "$2" --yes
  vercel env add "$1" development --value "$2" --yes
}

add_env VITE_FIREBASE_API_KEY "AIzaSyA4rg5HG0EiR6KJIB0hpZK9WEI4sRs7Sso"
add_env VITE_FIREBASE_AUTH_DOMAIN "bibletrivia-19824.firebaseapp.com"
add_env VITE_FIREBASE_PROJECT_ID "bibletrivia-19824"
add_env VITE_FIREBASE_STORAGE_BUCKET "bibletrivia-19824.firebasestorage.app"
add_env VITE_FIREBASE_MESSAGING_SENDER_ID "421920427750"
add_env VITE_FIREBASE_APP_ID "1:421920427750:web:9278d88d453ac5bf873527"
add_env VITE_FIREBASE_MEASUREMENT_ID "G-K2PVL0831V"
add_env VITE_API_BASE "https://abytrivia.pythonanywhere.com/api"
add_env VITE_HF_SPACE_URL "https://lennoxkk-trivia-model.hf.space"
