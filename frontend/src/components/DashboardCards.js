import React from "react";
import { FaTrophy, FaClipboardList, FaBook, FaCalendarAlt, FaChartBar } from "react-icons/fa";
import "./DashboardCards.css";

function DashboardCards({ role }) {
  return (
    <div className="dashboard-cards-grid">
      <div className="dashboard-card">
        <FaTrophy className="card-icon gold" />
        <div>
          <div className="card-title">My Progress</div>
          <div className="card-value">68%</div>
        </div>
      </div>
      <div className="dashboard-card">
        <FaClipboardList className="card-icon" />
        <div>
          <div className="card-title">Assignments</div>
          <div className="card-value">4 Pending</div>
        </div>
      </div>
      <div className="dashboard-card">
        <FaBook className="card-icon" />
        <div>
          <div className="card-title">Recent Sessions</div>
          <div className="card-value">2 This Week</div>
        </div>
      </div>
      <div className="dashboard-card">
        <FaCalendarAlt className="card-icon" />
        <div>
          <div className="card-title">Upcoming Events</div>
          <div className="card-value">3</div>
        </div>
      </div>
      {role === "teacher" && (
        <div className="dashboard-card">
          <FaChartBar className="card-icon" />
          <div>
            <div className="card-title">Analytics</div>
            <div className="card-value">View</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardCards;
