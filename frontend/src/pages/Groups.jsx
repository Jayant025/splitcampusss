import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import { Modal } from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/helpers";
import { Plus, UserPlus, FileText, Image } from "lucide-react";

export const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("hostel");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [inviteCode, setInviteCode] = useState("");

  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/groups");
      setGroups(res.groups);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load your squads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setFormError("");
    setCreateSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", type);
      formData.append("description", description);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await apiClient.post("/groups", formData);
      setCreateOpen(false);
      setName("");
      setType("hostel");
      setDescription("");
      setImageFile(null);
      loadGroups();
    } catch (err) {
      setFormError(err.message || "Failed to create group.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setFormError("");
    setJoinSubmitting(true);

    try {
      await apiClient.post("/groups/join", { inviteCode: inviteCode.trim() });
      setJoinOpen(false);
      setInviteCode("");
      loadGroups();
    } catch (err) {
      setFormError(err.message || "Failed to join group. Check the invite code.");
    } finally {
      setJoinSubmitting(false);
    }
  };

  const renderGroupsList = () => {
    if (!groups.length) {
      return (
        <article className="card stack-md" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>Squadless! 🎒</h3>
          <p className="muted-text">
            Create your own shared expense group or paste an invite code to join one.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create Group
            </button>
            <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
              <UserPlus size={16} /> Join Group
            </button>
          </div>
        </article>
      );
    }

    return (
      <div className="group-list">
        {groups.map((group) => (
          <article className="group-item card" key={group._id} style={{ display: "grid", gap: "1rem", background: "var(--surface)" }}>
            <div className="item-head">
              <div>
                <strong style={{ fontSize: "1.25rem", color: "var(--text-strong)" }}>{group.name}</strong>
                <div className="item-meta" style={{ marginTop: "0.2rem" }}>
                  <span className="eyebrow" style={{ padding: "0.15rem 0.5rem", fontSize: "0.75rem", textTransform: "capitalize" }}>{group.type}</span>
                  <span style={{ marginLeft: "0.5rem" }}>Invite Code: <strong>{group.inviteCode}</strong></span>
                </div>
              </div>
              <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                {group.currentUserRole}
              </span>
            </div>

            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {group.description || "No description added yet."}
            </p>

            <div className="item-meta" style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "0.8rem", display: "flex", gap: "1.5rem" }}>
              <span>Members: <strong>{group.memberCount}</strong></span>
              <span>Expenses: <strong>{group.expenseCount}</strong></span>
              <span>Total spent: <strong>{formatCurrency(group.totalExpenses)}</strong></span>
            </div>

            <div className="item-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="item-meta">Updated {formatDate(group.updatedAt)}</span>
              <button className="btn btn-primary" onClick={() => navigate(`/groups/${group._id}`)}>
                Open Squad
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <AppLayout
      title="Groups"
      subtitle="Create, join, and manage the spaces where your shared expenses live."
      actions={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
            <UserPlus size={16} /> Join Squad
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Squad
          </button>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <span className="eyebrow">Rummaging through your hostel bills... 🎒</span>
        </div>
      ) : error ? (
        <div className="card stack-md" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>Could not load squads 💔</h3>
          <p className="muted-text">{error}</p>
          <button className="btn btn-secondary" onClick={loadGroups}>
            Try Reloading
          </button>
        </div>
      ) : (
        renderGroupsList()
      )}

      {/* CREATE GROUP MODAL */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Squad">
        <form onSubmit={handleCreateGroup} className="stack-md">
          {formError && <div className="badge badge-danger btn-block">{formError}</div>}
          <div>
            <label htmlFor="groupName">Group Name</label>
            <input
              id="groupName"
              type="text"
              placeholder="e.g. Flat 302, Hostel Room 14, Goa Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="groupType">Group Type</label>
            <select id="groupType" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="hostel">Hostel roommates</option>
              <option value="flatmates">Flatmates</option>
              <option value="trip">College trip</option>
              <option value="event">Event team</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="groupDesc">Description</label>
            <textarea
              id="groupDesc"
              placeholder="A brief description of this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          <div>
            <label>Group Image (Optional)</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ display: "none" }}
                id="groupImgInput"
              />
              <label
                htmlFor="groupImgInput"
                className="btn btn-ghost"
                style={{ cursor: "pointer", display: "inline-flex", gap: "0.5rem", minHeight: "auto", padding: "0.6rem 1rem", marginBottom: 0 }}
              >
                <Image size={16} /> Choose File
              </label>
              <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                {imageFile ? imageFile.name : "No file chosen"}
              </span>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={createSubmitting} style={{ marginTop: "1rem" }}>
            {createSubmitting ? "Creating Squad..." : "Create Squad"}
          </button>
        </form>
      </Modal>

      {/* JOIN GROUP MODAL */}
      <Modal isOpen={joinOpen} onClose={() => setJoinOpen(false)} title="Join Existing Squad">
        <form onSubmit={handleJoinGroup} className="stack-md">
          {formError && <div className="badge badge-danger btn-block">{formError}</div>}
          <p className="muted-text" style={{ fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>
            Enter an invite code provided by a group member to join their shared bills dashboard!
          </p>
          <div>
            <label htmlFor="inviteCodeInput">Invite Code</label>
            <input
              id="inviteCodeInput"
              type="text"
              placeholder="e.g. SC-A9B8C7"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={joinSubmitting} style={{ marginTop: "1rem" }}>
            {joinSubmitting ? "Joining Squad..." : "Join Squad"}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
};
export default Groups;
