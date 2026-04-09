import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./presentation/pages/Home";
import Login from "./presentation/pages/Login";
import ConfirmacionCompra from "./presentation/pages/preorder";
import OrdersPage from "./presentation/pages/Orde";

import Navbar from "./presentation/components/Navbar";
import "./App.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/confirmacion" element={<ConfirmacionCompra />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </main>

      {/* ToastContainer para las notificaciones */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <footer className="bg-light text-center py-3 mt-5">
        <p className="mb-0">© 2026 Mi E-commerce. Todos los derechos reservados.  revisado como pirata xD </p>
      </footer>
    </Router>
  );
}

export default App;
