import { useState } from "react";
import "./App.css";

function App() {
  const [seccion, setSeccion] = useState("perfil");
  const [prendas, setPrendas] = useState([]);
  const [estilos, setEstilos] = useState(["Casual", "Minimalista"]);

  const toggleEstilo = (estilo) => {
    if (estilos.includes(estilo)) {
      setEstilos(estilos.filter((e) => e !== estilo));
    } else {
      setEstilos([...estilos, estilo]);
    }
  };

  const añadirPrenda = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPrendas([...prendas, { url, nombre: file.name }]);
  };

  return (
    <div className="app">
      <div className="header">
        <span className="logo">Vestidor</span>
      </div>

      <div className="nav">
        {["perfil", "armario", "outfits", "viajes"].map((s) => (
          <button
            key={s}
            className={`nav-btn ${seccion === s ? "active" : ""}`}
            onClick={() => setSeccion(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {seccion === "perfil" && (
        <div className="seccion">
          <div className="card">
            <h2>Tu perfil de estilo</h2>
            <p>Selecciona los estilos con los que te identificas:</p>
            <div className="tags">
              {["Casual", "Minimalista", "Clásico", "Boho", "Deportivo", "Formal"].map((e) => (
                <span
                  key={e}
                  className={`tag ${estilos.includes(e) ? "tag-active" : ""}`}
                  onClick={() => toggleEstilo(e)}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {seccion === "armario" && (
        <div className="seccion">
          <div className="card">
            <h2>Mi armario</h2>
            <label className="upload-btn">
              + Añadir prenda
              <input type="file" accept="image/*" onChange={añadirPrenda} hidden />
            </label>
            <div className="grid">
              {prendas.map((p, i) => (
                <div key={i} className="grid-item">
                  <img src={p.url} alt={p.nombre} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {seccion === "outfits" && (
        <div className="seccion">
          <div className="card">
            <h2>Mis outfits</h2>
            <p>Aquí podrás crear y guardar combinaciones de tu armario.</p>
          </div>
        </div>
      )}

      {seccion === "viajes" && (
        <div className="seccion">
          <div className="card">
            <h2>Viajes y eventos</h2>
            <p>Planifica tu maleta para cada viaje o evento.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;