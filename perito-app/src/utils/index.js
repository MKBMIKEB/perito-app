// Funciones auxiliares
export const formatDate = (date) => new Date(date).toLocaleDateString('es-CO');
export const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);