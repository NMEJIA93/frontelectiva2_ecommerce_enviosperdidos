import React, { useEffect, useState } from "react";
import { findSuppliers } from "../../../services/providerService";
import { findCategory } from "../../../services/categoryservice";
import { updateProduct, findProducts } from "../../../services/productService";
import { tokenService } from "../../../utils/tokenService";
import "../../../styles/CategoriaModal.css"; 
const ProductUpdateModal = ({ show, onClose }) => {
  const token = tokenService.getToken();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (show) {
      Promise.all([
        findProducts(token),
        findSuppliers(token),
        findCategory(token),
      ])
        .then(([prods, provs, cats]) => {
          setProductos(prods.products || []);
          setProveedores(provs.providers || []);
          setCategorias(cats.categories || []);
        })
        .catch((error) => {
          console.error("Error cargando datos:", error);
          setMensaje("Error cargando productos, categorías o proveedores");
        });
    }
  }, [show, token]);

  const handleSelectChange = (e) => {
    const productoId = e.target.value;
    const producto = productos.find((p) => p.id === productoId);
    setProductoSeleccionado(producto || null);
  };

  const handleChange = (e) => {
    setProductoSeleccionado({
      ...productoSeleccionado,
      [e.target.name]: e.target.value,
    });
  };

  const handleActualizar = async () => {
    if (!productoSeleccionado) {
      setMensaje("Por favor selecciona un producto");
      return;
    }

    const data = {
      name: productoSeleccionado.name,
      description: productoSeleccionado.description,
      cost: parseFloat(productoSeleccionado.cost),
      stock: parseInt(productoSeleccionado.stock) || 0,
      categoryId: productoSeleccionado.categoryId,
      images: Array.isArray(productoSeleccionado.images)
        ? productoSeleccionado.images
        : [productoSeleccionado.images],
      providers:
        productoSeleccionado.providers?.length > 0
          ? productoSeleccionado.providers
          : [],
     isDiscontinued:
  productoSeleccionado.isDiscontinued === true ||
  productoSeleccionado.isDiscontinued === "true",

    };

    try {
      await updateProduct(productoSeleccionado.id, data, token);
      setMensaje("Producto actualizado con éxito");
      setTimeout(() => {
        setMensaje("");
        setProductoSeleccionado(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      setMensaje(error.message || "Error al actualizar producto");
    }
  };

  if (!show) return null;

  return (
    <div className="categoria-modal-overlay">
      <div className="categoria-modal">
        {/* HEADER */}
        <div className="categoria-modal-header">
          <h5>Actualizar producto</h5>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="categoria-modal-body">
          <select
            className="input-minimal"
            onChange={handleSelectChange}
            value={productoSeleccionado?.id || ""}
          >
            <option value="">Seleccionar producto</option>
            {productos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.name}
              </option>
            ))}
          </select>

          {productoSeleccionado && (
            <>
              <input
                type="text"
                className="input-minimal"
                name="name"
                placeholder="Nombre del producto"
                value={productoSeleccionado.name || ""}
                onChange={handleChange}
              />

              <input
                type="number"
                className="input-minimal"
                name="cost"
                placeholder="Costo"
                value={productoSeleccionado.cost || ""}
                onChange={handleChange}
              />

              <input
                type="text"
                className="input-minimal"
                name="description"
                placeholder="Descripción"
                value={productoSeleccionado.description || ""}
                onChange={handleChange}
              />

              <select
                className="input-minimal"
                name="categoryId"
                value={productoSeleccionado.categoryId || ""}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                className="input-minimal"
                name="providers"
                value={productoSeleccionado.providers?.[0] || ""}
                onChange={(e) =>
                  setProductoSeleccionado({
                    ...productoSeleccionado,
                    providers: [e.target.value],
                  })
                }
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                className="input-minimal"
                name="images"
                placeholder="URL de la imagen"
                value={
                  Array.isArray(productoSeleccionado.images)
                    ? productoSeleccionado.images[0] || ""
                    : productoSeleccionado.images || ""
                }
                onChange={(e) =>
                  setProductoSeleccionado({
                    ...productoSeleccionado,
                    images: [e.target.value],
                  })
                }
              />

              <select
                className="input-minimal"
                name="isDiscontinued"
                value={productoSeleccionado.isDiscontinued ? "true" : "false"}
                onChange={(e) =>
                  setProductoSeleccionado({
                    ...productoSeleccionado,
                    isDiscontinued: e.target.value === "true",
                  })
                }
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </>
          )}

          {mensaje && (
            <p
              className={`modal-message ${
                mensaje.includes("éxito") ? "text-success" : "text-danger"
              }`}
            >
              {mensaje}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="categoria-modal-footer">
          <button className="btn-minimal" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-minimal" onClick={handleActualizar}>
            Actualizar producto
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductUpdateModal;
