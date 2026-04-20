import { useState, useEffect, useRef } from "react";
import { CATEGORIAS } from "./categorias";

function SelectorCategoria({ value, onChange, placeholder }) {
  const [abierto, setAbierto] = useState(false);
  const [grupoAbierto, setGrupoAbierto] = useState(null);
  const [subgrupoAbierto, setSubgrupoAbierto] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const seleccionar = (valor) => {
    onChange(valor);
    setAbierto(false);
    setGrupoAbierto(null);
    setSubgrupoAbierto(null);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", marginBottom: "10px" }}>
      <div
        onClick={() => setAbierto(!abierto)}
        style={{ padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ color: value ? "#2c2c2a" : "#aaa" }}>{value || placeholder || "Categoría..."}</span>
        <span style={{ fontSize: "10px", color: "#aaa" }}>▼</span>
      </div>

      {abierto && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e0ddd6", borderRadius: "8px", zIndex: 200, maxHeight: "300px", overflowY: "auto", marginTop: "4px" }}>
          {CATEGORIAS.map(g => (
            <div key={g.grupo}>
              <div
                onClick={() => setGrupoAbierto(grupoAbierto === g.grupo ? null : g.grupo)}
                style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "500", color: "#2c2c2a", background: "#f5f5f3", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
              >
                {g.grupo}
                <span style={{ fontSize: "10px", color: "#aaa" }}>{grupoAbierto === g.grupo ? "▲" : "▼"}</span>
              </div>

              {grupoAbierto === g.grupo && g.opciones && g.opciones.map(o => (
                <div
                  key={o}
                  onClick={() => seleccionar(o)}
                  style={{ padding: "9px 20px", fontSize: "13px", cursor: "pointer", color: value === o ? "#2c2c2a" : "#555", fontWeight: value === o ? "500" : "400", background: value === o ? "#f5f5f3" : "white" }}
                  onMouseEnter={e => e.target.style.background = "#f5f5f3"}
                  onMouseLeave={e => e.target.style.background = value === o ? "#f5f5f3" : "white"}
                >
                  {o}
                </div>
              ))}

              {grupoAbierto === g.grupo && g.subgrupos && g.subgrupos.map(s => (
                <div key={s.subgrupo}>
                  <div
                    onClick={() => s.opciones ? setSubgrupoAbierto(subgrupoAbierto === s.subgrupo ? null : s.subgrupo) : seleccionar(s.subgrupo)}
                    style={{ padding: "9px 20px", fontSize: "13px", cursor: "pointer", color: "#555", display: "flex", justifyContent: "space-between", background: "white" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f3"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    {s.subgrupo}
                    {s.opciones && <span style={{ fontSize: "10px", color: "#aaa" }}>{subgrupoAbierto === s.subgrupo ? "▲" : "▶"}</span>}
                  </div>

                  {subgrupoAbierto === s.subgrupo && s.opciones && s.opciones.map(o => (
                    <div
                      key={o}
                      onClick={() => seleccionar(o)}
                      style={{ padding: "9px 32px", fontSize: "13px", cursor: "pointer", color: value === o ? "#2c2c2a" : "#555", fontWeight: value === o ? "500" : "400", background: value === o ? "#f5f5f3" : "white" }}
                      onMouseEnter={e => e.target.style.background = "#f5f5f3"}
                      onMouseLeave={e => e.target.style.background = value === o ? "#f5f5f3" : "white"}
                    >
                      {o}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectorCategoria;