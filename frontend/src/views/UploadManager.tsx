import React, { useState, ChangeEvent } from "react";

// Definimos a interface para garantir que o código fique "limpo"
const UploadManager: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState<string>("estudo");

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo primeiro!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/upload?categoria=${categoria}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();
      alert(`Sucesso! Arquivo ${data.filename} enviado.`);
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h3>Gerenciador de Conhecimento</h3>
      <input
        type="file"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setFile(e.target.files?.[0] || null)
        }
      />
      <input
        type="text"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        placeholder="Categoria (ex: fisica)"
      />
      <button onClick={handleUpload}>Adicionar ao Cofre</button>
    </div>
  );
};

export default UploadManager;
