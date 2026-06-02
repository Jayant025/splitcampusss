import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-card stack-md"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <div
          className="section-header"
          style={{
            borderBottom: "1px solid var(--border-soft)",
            paddingBottom: "0.8rem",
            marginBottom: "0.5rem"
          }}
        >
          <h2 style={{ fontSize: "1.45rem", margin: 0 }}>{title}</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Close modal"
            style={{ padding: "0.5rem", minHeight: "auto", borderRadius: "10px" }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
