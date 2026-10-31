"use client";
/* Langue d'affichage des dates et des nombres : suit la langue de Jarvis (relais /lang, via I18n). */
export const L = { fr: true };
export const loc = () => (L.fr ? "fr-FR" : "en-GB");
