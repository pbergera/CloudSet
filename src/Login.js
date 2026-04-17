import { useState } from "react";
import { supabase } from "./supabase";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [esRegistro, setEsRegistro] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    setCargando(true);
    setError("");

    if (esRegistro) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else onLogin();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Email o contraseña incorrectos");
      else onLogin();
    }
    setCargando(false);
  };

  return (
    <div className="app">
      <div className="header">
        <span className="logo">CloudSet</span>
      </div>
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "16px" }}>
          {esRegistro ? "Crear cuenta" : "Iniciar sesión"}
        </h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "9px 12px", border: "1px solid #e0ddd6", borderRadius: "8px", fontSize: "14px" }}
        />
        {error && <p style={{ color: "red", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}
        <button
          onClick={handleSubmit}
          style={{ width: "100%", padding: "10px", background: "#2c2c2a", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", marginBottom: "12px" }}
        >
          {cargando ? "..." : esRegistro ? "Registrarse" : "Entrar"}
        </button>
        <p style={{ fontSize: "13px", color: "#888", textAlign: "center", cursor: "pointer" }}
          onClick={() => setEsRegistro(!esRegistro)}>
          {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </p>
      </div>
    </div>
  );
}

export default Login;