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
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("create") === "true") {
      setCreateOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
        <div className="empty-state" style={{ maxWidth: "560px", margin: "2rem auto" }}>
          <div className="empty-state-icon">
            <Users size={20} />
          </div>
          <h3>No active squads yet</h3>
          <p>Create your own shared expense group or paste an invite code to join one.</p>
          <div className="empty-state-actions">
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create Squad
            </button>
            <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
              <UserPlus size={16} /> Join Squad
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="group-grid">
        {groups.map((group) => (
          <article 
            className="card group-card animate-in fade-in slide-in-from-bottom-2 duration-300" 
            key={group._id}
            onClick={() => navigate(`/groups/${group._id}`)}
          >
            <div className="group-card-header">
              <div>
                <span className="group-card-type">{group.type}</span>
                <h3 className="group-card-name">{group.name}</h3>
              </div>
              <span className="group-card-role-badge">{group.currentUserRole}</span>
            </div>

            <p className="group-card-description">
              {group.description || "No description added yet."}
            </p>

            <div className="group-card-metrics">
              <div className="metric-item">
                <span className="metric-label">Members</span>
                <span className="metric-value">{group.memberCount}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Spent</span>
                <span className="metric-value">{formatCurrency(group.totalExpenses)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Invite Code</span>
                <span className="metric-value code">{group.inviteCode}</span>
              </div>
            </div>

            <div className="group-card-footer">
              <span className="group-card-updated">Updated {formatDate(group.updatedAt)}</span>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ minHeight: "auto", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  navigate(`/groups/${group._id}`); 
                }}
              >
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
