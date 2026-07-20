/** Crea una línea vacía del editor de ítems de la orden */
export function newLine() {
  return {
    key: crypto.randomUUID(),
    category: '',
    gender: '',
    inventoryItemId: '',
    itemType: 'prenda principal',
    quantity: 1,
  }
}
