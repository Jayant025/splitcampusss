import React from "react";
import { X, Calendar, Tag, FileText, Trash2, Edit, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/helpers";

export const TransactionDetailModal = ({ isOpen, onClose, expense, onEdit, onDelete }) => {
  if (!isOpen || !expense) return null;

  // Map category to icons/color accents
  const getCategoryTheme = (category) => {
    const defaultTheme = { icon: "stars", color: "var(--primary)" };
    const themes = {
      food: { icon: "restaurant", color: "var(--success)" },
      rent: { icon: "home", color: "var(--accent)" },
      wifi: { icon: "wifi", color: "var(--primary)" },
      electricity: { icon: "bolt", color: "var(--warning)" },
      grocery: { icon: "shopping_basket", color: "var(--success)" },
      groceries: { icon: "shopping_basket", color: "var(--success)" },
      travel: { icon: "flight", color: "var(--secondary)" },
      transport: { icon: "directions_car", color: "var(--secondary)" },
      cabs: { icon: "directions_car", color: "var(--secondary)" },
      shopping: { icon: "shopping_bag", color: "var(--primary)" },
      bills: { icon: "receipt", color: "var(--warning)" },
      health: { icon: "heart", color: "var(--danger)" },
      education: { icon: "book-open", color: "var(--primary)" },
      entertainment: { icon: "theater_comedy", color: "var(--primary)" },
      miscellaneous: { icon: "stars", color: "var(--primary)" },
      other: { icon: "stars", color: "var(--primary)" }
    };
    return themes[category?.toLowerCase()] || defaultTheme;
  };

  const themeConfig = getCategoryTheme(expense.category);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div 
        className="modal-card animate-in fade-in zoom-in-95 duration-200" 
        style={{ 
          maxWidth: "460px", 
          background: "var(--surface-overlay)",
          border: "1px solid var(--border-soft)",
          borderRadius: "24px",
          padding: "24px",
          position: "relative",
          boxShadow: "var(--shadow-lg)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "var(--primary-soft)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          className="hover-scale"
        >
          <X size={18} />
        </button>

        {/* Header Title */}
        <h2 style={{ fontSize: "1.25rem", fontWeight: "700", margin: "0 0 20px", color: "var(--text-strong)", fontFamily: "'Outfit', sans-serif" }}>
          Transaction Details
        </h2>

        {/* Hero Section: Amount & Status */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "16px 0 24px", position: "relative" }}>
          <div style={{ position: "absolute", width: "120px", height: "120px", background: `${themeConfig.color}15`, filter: "blur(40px)", borderRadius: "50%" }}></div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 8px", color: "var(--text-strong)", letterSpacing: "-0.02em" }}>
            {formatCurrency(expense.amount)}
          </h1>
          <span 
            style={{ 
              padding: "4px 12px", 
              background: "var(--success-soft)", 
              color: "var(--success)", 
              border: "1px solid rgba(22, 163, 74, 0.2)",
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: "700" 
            }}
          >
            Completed
          </span>
        </div>

        {/* Merchant / Expense Title Card */}
        <div 
          style={{ 
            background: "var(--surface-muted)", 
            borderRadius: "16px", 
            padding: "16px", 
            display: "flex", 
            alignItems: "center", 
            gap: "16px", 
            marginBottom: "16px",
            border: "1px solid var(--border-soft)"
          }}
        >
          <div 
            style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "50%", 
              background: "var(--surface-solid)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "1px solid var(--border-soft)",
              color: themeConfig.color
            }}
          >
            <Tag size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-strong)" }}>
              {expense.title}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "2px 0 0", textTransform: "capitalize" }}>
              {expense.category}
            </p>
          </div>
        </div>

        {/* Details Bento Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: "var(--surface-subtle)", border: "1px solid var(--border-soft)", borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.05em" }}>
              Date
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-strong)" }}>
              {formatDate(expense.date)}
            </span>
          </div>

          <div style={{ background: "var(--surface-subtle)", border: "1px solid var(--border-soft)", borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.05em" }}>
              Time
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-strong)" }}>
              {expense.date ? new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
            </span>
          </div>

          {/* Notes Card */}
          <div style={{ gridColumn: "1 / -1", background: "var(--surface-subtle)", border: "1px solid var(--border-soft)", borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.05em" }}>
              Private Note
            </span>
            <span style={{ fontSize: "0.9rem", color: expense.note ? "var(--text-strong)" : "var(--text-muted)", fontStyle: expense.note ? "normal" : "italic" }}>
              {expense.note || "No private note added."}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
          <button 
            onClick={() => {
              onEdit(expense);
              onClose();
            }} 
            className="btn btn-primary btn-block"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Edit size={16} />
            Edit Transaction
          </button>
          
          <button 
            onClick={() => {
              onDelete(expense._id);
              onClose();
            }} 
            className="btn btn-danger btn-block"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Trash2 size={16} />
            Delete Transaction
          </button>
        </div>
      </div>
    </div>
  );
};
