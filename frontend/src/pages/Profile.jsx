import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { formatDate } from "../utils/helpers";
import { User, Key, Image } from "lucide-react";

export const Profile = () => {
  const { user, updateProfile, updatePassword, refreshUser } = useAuth();

  // Profile Details Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passSubmitting, setPassSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (name.trim().length < 2) {
      setProfileError("Please enter your name (minimum 2 characters).");
      return;
    }

    try {
      setProfileSubmitting(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (photoFile) {
        formData.append("profilePhoto", photoFile);
      }

      await updateProfile(formData);
      setPhotoFile(null);
      setProfileSuccess("Profile updated successfully! 🎉");
      refreshUser();
    } catch (err) {
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }

    try {
      setPassSubmitting(true);
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassSuccess("Password updated successfully! 🔐");
    } catch (err) {
      setPassError(err.message || "Failed to change password. Please verify your current password.");
    } finally {
      setPassSubmitting(false);
    }
  };

  const renderProfileCard = () => {
    if (!user) return null;

    return (
      <article className="card" style={{ display: "flex", gap: "1.2rem", alignItems: "center", background: "var(--surface-emphasis)" }}>
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.name}
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-soft)" }}
          />
        ) : (
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "var(--surface-avatar-gradient)",
              color: "var(--text-inverse)",
              display: "grid",
              placeItems: "center",
              fontSize: "2rem",
              fontWeight: "bold"
            }}
          >
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <strong style={{ fontSize: "1.3rem", color: "var(--text-strong)" }}>{user.name}</strong>
          <div className="item-meta" style={{ marginTop: "0.2rem" }}>{user.email}</div>
          <div className="item-meta" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>Joined on {formatDate(user.createdAt)}</div>
        </div>
      </article>
    );
  };

  return (
    <AppLayout
      title="Profile"
      subtitle="Manage the identity details that appear across your SplitCampus groups."
    >
      <div className="stack-lg">
        {renderProfileCard()}

        <div className="content-grid two-column">
          {/* PROFILE FORM */}
          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <User size={18} /> Update Profile Info
            </h3>

            <form onSubmit={handleProfileSubmit} className="stack-md">
              {profileError && <div className="badge badge-danger btn-block">{profileError}</div>}
              {profileSuccess && <div className="badge badge-success btn-block" style={{ background: "var(--success-soft)", color: "var(--success-strong)" }}>{profileSuccess}</div>}

              <div>
                <label htmlFor="profName">Full Name</label>
                <input
                  id="profName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="profEmail">Email</label>
                <input
                  id="profEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Change Profile Avatar</label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    style={{ display: "none" }}
                    id="profilePicInput"
                  />
                  <label
                    htmlFor="profilePicInput"
                    className="btn btn-ghost"
                    style={{ cursor: "pointer", display: "inline-flex", gap: "0.5rem", minHeight: "auto", padding: "0.6rem 1rem", marginBottom: 0 }}
                  >
                    <Image size={16} /> Choose Image
                  </label>
                  <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                    {photoFile ? photoFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={profileSubmitting} style={{ marginTop: "0.5rem" }}>
                {profileSubmitting ? "Saving details..." : "Save Profile Details"}
              </button>
            </form>
          </section>

          {/* PASSWORD FORM */}
          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Key size={18} /> Update Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="stack-md">
              {passError && <div className="badge badge-danger btn-block">{passError}</div>}
              {passSuccess && <div className="badge badge-success btn-block" style={{ background: "var(--success-soft)", color: "var(--success-strong)" }}>{passSuccess}</div>}

              <div>
                <label htmlFor="currPass">Current Password</label>
                <input
                  id="currPass"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="newPass">New Password</label>
                <input
                  id="newPass"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="confPass">Confirm New Password</label>
                <input
                  id="confPass"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={passSubmitting} style={{ marginTop: "0.5rem" }}>
                {passSubmitting ? "Updating password..." : "Update Security Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};
export default Profile;
