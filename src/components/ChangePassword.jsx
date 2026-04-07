import React, { useState } from "react";
import "../styles/changePassword.css";

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      return setError("All fields are required");
    }

    if (form.newPassword !== form.confirmPassword) {
      return setError("New passwords do not match");
    }

    try {
      // 👉 Replace with your API
      // await axios.post("/api/change-password", form, { withCredentials: true });

      setMessage("Password changed successfully!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="cp-container">
      <div className="cp-card">
        <h2>Change Password 🔐</h2>

        {error && <p className="cp-error">{error}</p>}
        {message && <p className="cp-success">{message}</p>}

        <form onSubmit={handleSubmit}>
          {/* Old Password */}
          <div className="cp-field">
            <label>Old Password</label>
            <div className="cp-input">
              <input
                type={show.old ? "text" : "password"}
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Enter old password"
              />
              <span onClick={() => setShow({ ...show, old: !show.old })}>
                👁️
              </span>
            </div>
          </div>

          {/* New Password */}
          <div className="cp-field">
            <label>New Password</label>
            <div className="cp-input">
              <input
                type={show.new ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />
              <span onClick={() => setShow({ ...show, new: !show.new })}>
                👁️
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="cp-field">
            <label>Confirm Password</label>
            <div className="cp-input">
              <input
                type={show.confirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
              <span
                onClick={() =>
                  setShow({ ...show, confirm: !show.confirm })
                }
              >
                👁️
              </span>
            </div>
          </div>

          <button type="submit" className="cp-btn">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;