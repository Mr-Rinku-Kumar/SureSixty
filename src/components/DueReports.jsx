import React, { useState } from "react";
import "../styles/dueReports.css";

const dummyData = [
  {
    id: 1,
    branch: "Sure60 Gurukul Ganaur",
    student: "Sahil",
    roll: 2899,
    amount: -75000,
    date: "2025-06-22",
    room: 13,
    bed: "03",
    library: "Library - 9",
    seat: 27
  },
  {
    id: 2,
    branch: "Sure60 Gurukul Ganaur",
    student: "Pushpendra Gautam",
    roll: 5274,
    amount: 9100,
    date: "2026-03-23",
    room: 119,
    bed: "04",
    library: "Library - 5",
    seat: 41
  }
];

const Table = ({ title, subtitle }) => {
  const [branch, setBranch] = useState("");
  const [date, setDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = dummyData.filter(item => {
    const matchesBranch = !branch || item.branch === branch;
    const matchesDate = !date || item.date === date;
    const matchesSearch = !searchTerm || 
      item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.roll.toString().includes(searchTerm);
    return matchesBranch && matchesDate && matchesSearch;
  });

  const totalDue = filteredData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="report-card">
      {/* Header */}
      <div className="report-header">
        <div className="header-left">
          <h3>{title}</h3>
          {subtitle && <span className="subtitle">{subtitle}</span>}
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-label">Total Due:</span>
            <span className={`stat-value ${totalDue < 0 ? 'negative' : 'positive'}`}>
              ₹ {totalDue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Branch</label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            <option value="Sure60 Gurukul Ganaur">Sure60 Gurukul Ganaur</option>
            <option value="Branch 2">Branch 2</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Due Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Student name or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-actions">
          <button className="search-btn" onClick={() => {}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </button>

          <button className="excel-btn" title="Export to Excel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="16" x2="16" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="8" y1="8" x2="12" y2="8"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Branch</th>
              <th>Student</th>
              <th>Roll No</th>
              <th>Due Amount</th>
              <th>Due Date</th>
              <th>Room No</th>
              <th>Bed No</th>
              <th>Library</th>
              <th>Seat No</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, i) => (
                <tr key={item.id} className="table-row">
                  <td className="sl-no">{i + 1}</td>
                  <td>{item.branch}</td>
                  <td className="student-name">{item.student}</td>
                  <td>{item.roll}</td>
                  <td className={`amount ${item.amount < 0 ? "negative" : "positive"}`}>
                    <span className="currency">₹</span> {Math.abs(item.amount).toLocaleString()}
                    {item.amount < 0 && <span className="badge">Credit</span>}
                  </td>
                  <td className="date-cell">{new Date(item.date).toLocaleDateString('en-IN')}</td>
                  <td>{item.room}</td>
                  <td>{item.bed}</td>
                  <td>{item.library}</td>
                  <td>{item.seat}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-data">
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredData.length > 0 && (
        <div className="table-footer">
          <div className="pagination">
            <button className="page-btn" disabled>←</button>
            <span className="page-info">Page 1 of 1</span>
            <button className="page-btn" disabled>→</button>
          </div>
          <div className="records-info">
            Showing {filteredData.length} of {dummyData.length} records
          </div>
        </div>
      )}
    </div>
  );
};

const DueReports = () => {
  return (
    <div className="due-reports-container">
      <div className="page-header">
        <h1>Due Reports</h1>
        <p>Track and manage student dues efficiently</p>
      </div>
      <div className="due-wrapper">
        <Table title="Monthly Due Report" subtitle="Current month dues overview" />
        <Table title="6 Months Due Report" subtitle="Long-term dues analysis" />
      </div>
    </div>
  );
};

export default DueReports;