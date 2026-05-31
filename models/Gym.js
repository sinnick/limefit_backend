const mongoose = require('mongoose');

// Subdocumento de tema: valores HSL (sin la función hsl()) con los mismos
// nombres que las variables CSS de styles/globals.css y que tenant.theme.
// Solo primary/accent/ring tienen default (estilo LimeFit verde lima) para que
// un gym recién creado se vea bien. El resto queda undefined y el helper de
// branding los omite → caen a los defaults de globals.css (igual que limefit).
const temaSchema = mongoose.Schema(
    {
        "primary": { type: String, default: "84 81% 44%" },
        "primary-foreground": { type: String, default: "0 0% 100%" },
        "accent": { type: String, default: "84 81% 44%" },
        "accent-foreground": { type: String, default: "0 0% 100%" },
        "ring": { type: String, default: "84 81% 44%" },
        "background": { type: String },
        "foreground": { type: String },
        "card": { type: String },
        "card-foreground": { type: String },
        "popover": { type: String },
        "popover-foreground": { type: String },
        "secondary": { type: String },
        "secondary-foreground": { type: String },
        "muted": { type: String },
        "muted-foreground": { type: String },
        "border": { type: String },
        "input": { type: String },
    },
    { _id: false }
);

const schema = mongoose.Schema({
    // unique se declara abajo con schema.index() (evita índice duplicado).
    "SLUG": { type: String, required: true, lowercase: true, trim: true },
    "NOMBRE": { type: String, required: true },
    "DESCRIPCION": { type: String, default: "" },
    "DARK": { type: Boolean, default: false },
    "TEMA": { type: temaSchema, default: () => ({}) },
    "FONTS": { type: Object, default: null },
    "LOGO": { type: String, default: "" },
    "FAVICON": { type: String, default: "" },
    "CONTACTO_EMAIL": { type: String, default: "" },
    "TELEFONO": { type: String, default: "" },
    "ACTIVO": { type: Boolean, default: true },
    "FECHA_CREACION": { type: Date, default: Date.now },
    "FECHA_MODIFICACION": { type: Date },
});

// SLUG es la PK alternativa (gymId del gym): único global para que dos gyms de
// DB no choquen entre sí. La colisión con limefit/level se valida en el
// endpoint (RESERVED_SLUGS), no por índice (esos tenants no viven en esta colección).
schema.index({ SLUG: 1 }, { unique: true });

export default mongoose.models.Gym || mongoose.model('Gym', schema);
