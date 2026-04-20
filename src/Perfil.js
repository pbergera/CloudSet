import { useState, useEffect } from "react";
import { supabase } from "./supabase";

function Perfil({ usuario, onCerrarSesion, onEstilosActualizados }) {
  const [nombre, setNombre] = useState(usuario.user_metadata?.nombre || "");
  const [guardado, setGuardado] = useState(false);
  const [cambioPassword, setCambioPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");
  const [fotoCara, setFotoCara] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [estilos, setEstilos] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data } = await supabase.from("usuarios").select("foto_cara, estilos").eq("id", usuario.id).single();
      if (data?.foto_cara) setFotoCara(data.foto_cara);
      if (data?.estilos) setEstilos(data.estilos);
    };
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardarNombre = async () => {
    await supabase.auth.updateUser({ data: { nombre } });
    await supabase.from("usuarios").upsert({ id: usuario.id, nombre });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const cambiarPassword = async () => {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) setMensajePassword("Error al cambiar la contrasena");
    else {
      setMensajePassword("Contrasena actualizada correctamente");
      setNuevaPassword("");
      setCambioPassword(false);
    }
    setTimeout(() => setMensajePassword(""), 3000);
  };

  const subirFotoPerfil = async (file) => {
    setCargandoFoto(true);
    const nombreArchivo = `${usuario.id}_cara`;
    const { error } = await supabase.storage.from("perfiles").upload(nombreArchivo, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("perfiles").getPublicUrl(nombreArchivo);
      const url = data.publicUrl + "?t=" + Date.now();
      setFotoCara(url);
      await supabase.from("usuarios").upsert({ id: usuario.id, foto_cara: data.publicUrl });
      if (onEstilosActualizados) onEstilosActualizados(url);
    }
    setCargandoFoto(false);
  };

  const toggleEstilo = async (estilo) => {
    const nuevos = estilos.includes(estilo)
      ? estilos.filter(e => e !== estilo)
      : [...estilos, estilo];
    setEstilos(nuevos);
    await supabase.from("usuarios").upsert({ id: usuario.id, estilos: nuevos });
  };

  return (
    <div className="seccion">
      <div className="card">
        <h2>Mi perfil</h2>
        <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px" }}>{usuario.email}</p>

        <label style={{ fontSize: "13px", color: "#888", display: "block", marginBottom: "6px" }}>Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
        />
        <button onClick={guardarNombre} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
          {guardado ? "Guardado" : "Guardar nombre"}
        </button>

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Tu perfil de estilo</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {["Casual", "Minimalista", "Clasico", "Boho", "Deportivo", "Formal"].map(e => (
            <span
              key={e}
              onClick={() => toggleEstilo(e)}
              style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "20px", border: "1px solid #e0ddd6", cursor: "pointer", background: estilos.includes(e) ? "#2c2c2a" : "white", color: estilos.includes(e) ? "white" : "#888" }}
            >
              {e}
            </span>
          ))}
        </div>

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Foto de perfil</p>
        <label style={{ cursor: "pointer", display: "block", marginBottom: "16px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "1px dashed #e0ddd6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f3" }}>
            {fotoCara ? <img src={fotoCara} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "12px", color: "#aaa" }}>+ Foto</span>}
          </div>
          <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && subirFotoPerfil(e.target.files[0])} />
        </label>
        {cargandoFoto && <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>Subiendo foto...</p>}

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Contrasena</p>
        {!cambioPassword ? (
          <button onClick={() => setCambioPassword(true)} style={{ width: "100%", padding: "10px", background: "white", color: "#2c2c2a", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
            Cambiar contrasena
          </button>
        ) : (
          <>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Nueva contrasena"
              style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
            />
            <button onClick={cambiarPassword} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>
              Confirmar nueva contrasena
            </button>
            <button onClick={() => setCambioPassword(false)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
              Cancelar
            </button>
          </>
        )}
        {mensajePassword && <p style={{ fontSize: "13px", color: "green", marginBottom: "16px" }}>{mensajePassword}</p>}

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <button onClick={onCerrarSesion} style={{ width: "100%", padding: "10px", background: "white", color: "#cc3333", border: "1px solid #cc3333", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}

export default Perfil;