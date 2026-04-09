# Tareas Pendientes de Localización (Auditoría Final)

Este documento detalla los hallazgos de la auditoría final que deben ser corregidos para asegurar una localización completa al 100% en todos los idiomas.

## Hallazgos de la Auditoría

- [ ] **RegenerateQRDialog.tsx**: Localizar este componente que explica las "Reglas" de la regeneración de códigos QR (actualmente está completamente en inglés).
- [ ] **PWAUpdatePrompt.tsx**: Localizar las notificaciones de actualización del sistema ("Update available", "Updating...", etc.).
- [ ] **Atributos Alt**: Reemplazar atributos `alt` hardcodeados por llaves de traducción:
    - [ ] Logo de Terreta (`alt="Terreta"`) en `About.tsx`, `MobileNav.tsx`, `DesktopHeader.tsx`.
    - [ ] Códigos QR (`alt="Verification QR Code"`) en diálogos de generación de QR y `CreateCacheLanding.tsx`.
- [ ] **LoginDialog.tsx**: 
    - [ ] Localizar mensajes de error de login por Bunker.
    - [ ] Cambiar la identificación hardcodeada "Terreta.to" por el nombre de la app localizado.
- [ ] **Formulario de Geocaché**: Localizar las etiquetas `alt` de las imágenes subidas por el usuario (actualmente en inglés).
- [ ] **Paridad de Idiomas**: Asegurar que todas las nuevas llaves se añadan a los 6 archivos de idioma (`en`, `es`, `val`, `de`, `ja`, `th`).
