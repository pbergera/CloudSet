import { useState } from "react";
import { supabase } from "./supabase";

function Perfil({ usuario, onCerrarSesion }) {
  const [nombre, setNombre] = useState(usuario.user_metadata?.nombre || "");
  const [guardado, setGuardado] = useState(false);
  const [cambioPassword, setCambioPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");

  const guardarNombre = async () => {
    await supabase.auth.updateUser({ data: { nombre } });
    await supabase.from("usuarios").upsert({ id: usuario.id, nombre });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const cambiarPassword = async () => {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) setMensajePassword("Error al cambiar la contraseña");
    else {
      setMensajePassword("Contraseña actualizada correctamente");
      setNuevaPassword("");
      setCambioPassword(false);
    }
    setTimeout(() => setMensajePassword(""), 3000);
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
          {guardado ? "✓ Guardado" : "Guardar nombre"}
        </button>

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Contraseña</p>
        {!cambioPassword ? (
          <button onClick={() => setCambioPassword(true)} style={{ width: "100%", padding: "10px", background: "white", color: "#2c2c2a", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
            Cambiar contraseña
          </button>
        ) : (
          <>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Nueva contraseña"
              style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
            />
            <button onClick={cambiarPassword} style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "8px" }}>
              Confirmar nueva contraseña
            </button>
            <button onClick={() => setCambioPassword(false)} style={{ width: "100%", padding: "10px", background: "white", color: "#888", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
              Cancelar
            </button>
          </>
        )}
        {mensajePassword && <p style={{ fontSize: "13px", color: "green", marginBottom: "16px" }}>{mensajePassword}</p>}

        <div style={{ height: "1px", background: "#e0ddd6", marginBottom: "16px" }} />

        <button onClick={onCerrarSesion} style={{ width: "100%", padding: "10px", background: "white", color: "#cc3333", border: "1px solid #cc3333", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Perfil;