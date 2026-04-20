export const CATEGORIAS = [
  {
    grupo: "PRENDAS",
    opciones: [
      "ABRIGOS",
      "CHAQUETAS",
      "BLAZERS",
      "JERSÉIS & CÁRDIGANS",
      "CAMISAS & BLUSAS",
      "CAMISETAS",
      "TOPS & BODIES",
      "VESTIDOS & MONOS",
      "PANTALONES",
      "VAQUEROS",
      "FALDAS",
      "SHORTS & BERMUDAS",
      "BIKINIS & BAÑADORES",
      "TOTAL LOOK",
      "SPORT",
      "PIJAMAS",
      "LENCERÍA"
    ]
  },
  {
    grupo: "ZAPATOS & ACCESORIOS",
    subgrupos: [
      {
        subgrupo: "ZAPATOS",
        opciones: ["SANDALIAS", "BAILARINAS", "TACÓN", "ZAPATOS PLANOS", "BOTAS & BOTINES", "DEPORTIVAS"]
      },
      {
        subgrupo: "BOLSOS",
        opciones: null
      },
      {
        subgrupo: "BISUTERÍA",
        opciones: ["PENDIENTES", "COLLARES", "PULSERAS", "ANILLOS"]
      },
      {
        subgrupo: "CINTURONES",
        opciones: null
      },
      {
        subgrupo: "MARROQUINERÍA",
        opciones: null
      },
      {
        subgrupo: "PAÑUELOS & BUFANDAS",
        opciones: null
      },
      {
        subgrupo: "SOMBREROS & GORRAS",
        opciones: null
      },
      {
        subgrupo: "GAFAS DE SOL",
        opciones: null
      },
      {
        subgrupo: "MÁS ACCESORIOS",
        opciones: null
      }
    ]
  }
];

export const TODAS_CATEGORIAS = CATEGORIAS.flatMap(g =>
  g.opciones
    ? g.opciones
    : g.subgrupos.flatMap(s => s.opciones ? s.opciones : [s.subgrupo])
);