export const CATEGORIAS = [
  { grupo: "Armario", opciones: [
    "Abrigos",
    "Gabardinas / Cazadoras",
    "Blazers",
    "Vestidos",
    "Tops",
    "Camisas",
    "Camisetas",
    "Bodies",
    "Pantalones",
    "Faldas",
    "Shorts / Bermudas",
    "Chaquetas / Jerseis",
    "Total Look",
    "Sudaderas / Joggers",
    "Lenceria"
  ]},
  { grupo: "Zapatos & Accesorios", opciones: [
    "Zapatos",
    "Bolsos",
    "Bisuteria",
    "Accesorios - Bano",
    "Panuelos / Bufandas",
    "Cinturones",
    "Gorros",
    "Guantes",
    "Calcetines"
  ]}
];

export const TODAS_CATEGORIAS = CATEGORIAS.flatMap(g => g.opciones);