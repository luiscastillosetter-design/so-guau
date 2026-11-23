// Datos demo del panel cuando aún no hay credenciales de Supabase.
const ids = {
  d1: "demo-dep-1",
  d2: "demo-dep-2",
  f1: "demo-fmt-1",
  f2: "demo-fmt-2",
};

export const ADMIN_DEMO_DATA = {
  store_settings: {
    id: "demo-settings",
    nombre: "So Guau",
    eslogan: "Moda que deja huellas",
    dominio: "https://soguau.com",
    logo_url: null,
    theme_key: "so-guau",
    whatsapp: "584120000000",
    pago_movil: { banco: "Banco de ejemplo (0000)", telefono: "0412-0000000", cedula: "V-00000000" },
    binance: { id: "000000000", correo: "pagos@soguau.com" },
    transferencia: { banco: "Banco de ejemplo", cuenta: "0000-0000-00-0000000000", titular: "So Guau C.A.", rif: "J-00000000-0" },
    prompt_bot: "Eres el asistente de So Guau, tienda de moda para mascotas y sus dueños. Responde en español, cálido y breve.",
  },
  departments: [
    { id: ids.d1, slug: "frenchies", nombre: "Frenchies", subtitulo: "Para los dueños de bulldogs franceses", orden: 1, activo: true },
    { id: ids.d2, slug: "gatos", nombre: "Gatos", subtitulo: "Elegancia felina", orden: 2, activo: true },
  ],
  product_formats: [
    { id: ids.f1, slug: "franelas", nombre: "Franelas", display_mode: "rack", orden: 1, activo: true },
    { id: ids.f2, slug: "tazas", nombre: "Tazas", display_mode: "shelf", orden: 2, activo: true },
  ],
  blank_stock: [
    { id: "demo-bs-1", format_id: ids.f1, color: "Carbón", talla: "M", in_stock: true },
    { id: "demo-bs-2", format_id: ids.f1, color: "Carbón", talla: "XXL", in_stock: false },
    { id: "demo-bs-3", format_id: ids.f1, color: "Verde bosque", talla: "S", in_stock: false },
  ],
  products: [
    {
      id: "demo-prod-1", department_id: ids.d1, format_id: ids.f1, nombre: "Franela Frenchie Club", precio_usd: 18, badge: "Nuevo",
      foto_perfil_url: null, foto_frente_url: null, foto_espalda_url: null,
      colores_json: [{ name: "Carbón", hex: "#333333" }], es_personalizable: true, activo: true,
    },
  ],
  hero_slides: [
    { id: "demo-hero-1", media_type: "image", media_url: "/hero/demo.jpg", titulo: "Moda que deja huellas", subtitulo: "Colección nueva", cta_texto: "Ver tienda", cta_link: "/tienda", orden: 1, activo: true },
  ],
  custom_templates: [
    { id: "demo-tpl-1", slug: "estilo-gema", nombre: "Estilo GEMA", descripcion: "Mitad nombre + mitad rostro", modo: "gema", prompt_sistema: "Create a stylized split-portrait print…", max_fotos: 1, activo: true },
  ],
  orders: [
    {
      id: "demo-order-1", codigo: "SG-DEMO", cliente_nombre: "Cliente de ejemplo", cliente_whatsapp: "584120000000",
      items_json: [{ name: "Franela Frenchie Club", color: "Carbón", size: "M", quantity: 1, priceUsd: 18, isCustom: false }],
      total_usd: 18, tasa_bcv: 40, total_bs: 720, metodo_pago: "Pago Móvil", referencia: "123456", comprobante_url: null,
      estado: "por_verificar", created_at: new Date().toISOString(),
    },
  ],
  ai_leads: [
    { id: "demo-lead-1", nombre: "Lead de ejemplo", whatsapp: "584120000000", ip_hash: "demo", generaciones_usadas: 2, ultima_generacion_at: new Date().toISOString() },
  ],
};
